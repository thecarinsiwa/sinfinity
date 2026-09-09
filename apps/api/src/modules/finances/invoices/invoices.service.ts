import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  isNull,
  like,
  type SQL,
} from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  currencies,
  customers,
  invoice_items,
  invoices,
  products,
  sales_order_items,
  sales_orders,
  services,
  taxes,
} from '../../../database/schema';
import {
  computeHeaderTotals,
  computeLineTotals,
  formatDecimal,
} from '../../sales-orders/sales-orders-totals';
import {
  isMysqlDuplicateError,
  throwFkOrRethrow,
} from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../finances-scope';
import {
  assertInvoiceTransition,
  INVOICE_STATUS,
  type InvoiceStatus,
} from '../invoice-statuses';
import { AccountsLedgerService } from '../ledger/accounts-ledger.service';
import {
  CreateInvoiceDto,
  CreateInvoiceFromSalesOrderDto,
  CreateInvoiceItemDto,
  InvoiceItemResponseDto,
  InvoiceResponseDto,
  IssueInvoiceDto,
  ListInvoicesQueryDto,
  TransitionInvoiceDto,
  UpdateInvoiceDto,
  UpdateInvoiceItemDto,
} from './dto/invoice.dto';
import {
  toInvoiceItemResponse,
  toInvoiceResponse,
  type InvoiceItemRow,
  type InvoiceRow,
} from './invoices.mapper';

type Tx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];

function toDateOnly(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.slice(0, 10);
}

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

@Injectable()
export class InvoicesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly accountsLedger: AccountsLedgerService,
  ) {}

  async findAll(
    query: ListInvoicesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<InvoiceResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      search,
      status,
      customerId,
      salesOrderId,
      includeDeleted,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [eq(invoices.organization_id, scopeOrgId)];
    if (!includeDeleted) {
      parts.push(isNull(invoices.deleted_at));
    }
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      parts.push(like(invoices.invoice_number, term));
    }
    if (status) parts.push(eq(invoices.status, status));
    if (customerId) parts.push(eq(invoices.customer_id, customerId));
    if (salesOrderId) {
      parts.push(eq(invoices.sales_order_id, salesOrderId));
    }
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(invoices).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(invoices)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(invoices.created_at), asc(invoices.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as InvoiceRow[]).map((row) => toInvoiceResponse(row)),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InvoiceResponseDto> {
    const row = await this.requireInvoiceAccess(
      id,
      currentOrganizationId,
      user,
    );
    const items = await this.loadItems(id);
    return toInvoiceResponse(row, items);
  }

  async create(
    dto: CreateInvoiceDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InvoiceResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'invoice',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureCustomerInOrg(dto.customerId, organizationId);
    if (dto.salesOrderId) {
      await this.ensureSalesOrderLinkable(
        dto.salesOrderId,
        organizationId,
        dto.customerId,
      );
    }
    if (dto.currencyId) {
      await this.ensureCurrencyExists(dto.currencyId);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.transaction(async (tx) => {
        await tx.insert(invoices).values({
          id,
          organization_id: organizationId,
          invoice_number: dto.invoiceNumber.trim(),
          customer_id: dto.customerId,
          sales_order_id: dto.salesOrderId ?? null,
          issue_date: toDateOnly(dto.issueDate)!,
          due_date: toDateOnly(dto.dueDate),
          currency_id: dto.currencyId ?? null,
          subtotal: '0.0000',
          tax_amount: '0.0000',
          total_amount: '0.0000',
          amount_paid: '0.0000',
          status: INVOICE_STATUS.DRAFT,
          notes: dto.notes ?? null,
          created_at: now,
          updated_at: now,
          created_by: user?.id ?? null,
          updated_by: user?.id ?? null,
          deleted_at: null,
        });

        for (const item of dto.items ?? []) {
          await this.insertItem(id, organizationId, item, tx);
        }
        if ((dto.items?.length ?? 0) > 0) {
          await this.recalculateTotals(id, user?.id ?? null, tx);
        }
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throw new ConflictException(
          `Invoice number "${dto.invoiceNumber.trim()}" already exists in this organization`,
        );
      }
      throwFkOrRethrow(error, 'Invalid invoice reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async createFromSalesOrder(
    dto: CreateInvoiceFromSalesOrderDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InvoiceResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'invoice',
    );
    await ensureOrganizationExists(this.db, organizationId);

    const [order] = await this.db
      .select()
      .from(sales_orders)
      .where(
        and(
          eq(sales_orders.id, dto.salesOrderId),
          isNull(sales_orders.deleted_at),
        ),
      )
      .limit(1);
    if (!order) {
      throw new NotFoundException(
        `Sales order ${dto.salesOrderId} not found`,
      );
    }
    if (order.organization_id !== organizationId) {
      throw new BadRequestException(
        'Sales order must belong to the same organization',
      );
    }

    const soItems = await this.db
      .select()
      .from(sales_order_items)
      .where(eq(sales_order_items.sales_order_id, dto.salesOrderId))
      .orderBy(asc(sales_order_items.created_at), asc(sales_order_items.id));

    const id = createId();
    const now = nowMysqlDateTime();
    const issueDate = toDateOnly(dto.issueDate) ?? todayUtcDate();

    try {
      await this.db.transaction(async (tx) => {
        await tx.insert(invoices).values({
          id,
          organization_id: organizationId,
          invoice_number: dto.invoiceNumber.trim(),
          customer_id: order.customer_id,
          sales_order_id: order.id,
          issue_date: issueDate,
          due_date: toDateOnly(dto.dueDate),
          currency_id: order.currency_id,
          subtotal: '0.0000',
          tax_amount: '0.0000',
          total_amount: '0.0000',
          amount_paid: '0.0000',
          status: INVOICE_STATUS.DRAFT,
          notes: dto.notes ?? null,
          created_at: now,
          updated_at: now,
          created_by: user?.id ?? null,
          updated_by: user?.id ?? null,
          deleted_at: null,
        });

        for (const soItem of soItems) {
          await this.insertItem(
            id,
            organizationId,
            {
              productId: soItem.product_id,
              serviceId: soItem.service_id,
              description: soItem.description,
              quantity: soItem.quantity,
              unitPrice: soItem.unit_price,
              taxId: soItem.tax_id,
            },
            tx,
          );
        }
        await this.recalculateTotals(id, user?.id ?? null, tx);
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throw new ConflictException(
          `Invoice number "${dto.invoiceNumber.trim()}" already exists in this organization`,
        );
      }
      throwFkOrRethrow(error, 'Invalid invoice reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateInvoiceDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InvoiceResponseDto> {
    const existing = await this.requireInvoiceAccess(
      id,
      currentOrganizationId,
      user,
    );
    this.assertHeaderEditable(existing.status);

    const customerId = dto.customerId ?? existing.customer_id;
    if (dto.customerId) {
      await this.ensureCustomerInOrg(dto.customerId, existing.organization_id);
    }
    if (dto.salesOrderId) {
      await this.ensureSalesOrderLinkable(
        dto.salesOrderId,
        existing.organization_id,
        customerId,
      );
    }
    if (dto.currencyId) {
      await this.ensureCurrencyExists(dto.currencyId);
    }

    const patch: Partial<{
      invoice_number: string;
      customer_id: string;
      sales_order_id: string | null;
      issue_date: string;
      due_date: string | null;
      currency_id: string | null;
      notes: string | null;
      updated_at: string;
      updated_by: string | null;
    }> = {
      updated_at: nowMysqlDateTime(),
      updated_by: user?.id ?? null,
    };

    if (dto.invoiceNumber !== undefined) {
      patch.invoice_number = dto.invoiceNumber.trim();
    }
    if (dto.customerId !== undefined) patch.customer_id = dto.customerId;
    if (dto.salesOrderId !== undefined) {
      patch.sales_order_id = dto.salesOrderId;
    }
    if (dto.issueDate !== undefined) {
      patch.issue_date = toDateOnly(dto.issueDate)!;
    }
    if (dto.dueDate !== undefined) patch.due_date = toDateOnly(dto.dueDate);
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.notes !== undefined) patch.notes = dto.notes;

    try {
      await this.db.update(invoices).set(patch).where(eq(invoices.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throw new ConflictException(
          `Invoice number already exists in this organization`,
        );
      }
      throwFkOrRethrow(error, 'Invalid invoice reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const existing = await this.requireInvoiceAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (
      existing.status !== INVOICE_STATUS.DRAFT &&
      existing.status !== INVOICE_STATUS.CANCELLED
    ) {
      throw new BadRequestException(
        'Only draft or cancelled invoices can be deleted',
      );
    }
    await this.db
      .update(invoices)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(invoices.id, id));
  }

  async issue(
    id: string,
    dto: IssueInvoiceDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InvoiceResponseDto> {
    const existing = await this.requireInvoiceAccess(
      id,
      currentOrganizationId,
      user,
    );
    try {
      assertInvoiceTransition(existing.status, INVOICE_STATUS.ISSUED);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    const items = await this.loadItems(id);
    if (items.length === 0) {
      throw new BadRequestException('Cannot issue an invoice without items');
    }

    const issueDate =
      toDateOnly(dto.issueDate) ?? toDateOnly(existing.issue_date)!;
    const dueDate =
      dto.dueDate !== undefined
        ? toDateOnly(dto.dueDate)
        : toDateOnly(existing.due_date);

    await this.db.transaction(async (tx) => {
      await tx
        .update(invoices)
        .set({
          status: INVOICE_STATUS.ISSUED,
          issue_date: issueDate,
          due_date: dueDate,
          updated_at: nowMysqlDateTime(),
          updated_by: user?.id ?? null,
        })
        .where(eq(invoices.id, id));

      await this.accountsLedger.upsertReceivable(
        {
          organizationId: existing.organization_id,
          customerId: existing.customer_id,
          invoiceId: id,
          originalAmount: existing.total_amount,
          amountPaid: existing.amount_paid,
          dueDate,
        },
        tx,
      );
    });

    return this.findOne(id, currentOrganizationId, user);
  }

  async transition(
    id: string,
    dto: TransitionInvoiceDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InvoiceResponseDto> {
    const existing = await this.requireInvoiceAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (dto.toStatus === INVOICE_STATUS.ISSUED) {
      throw new BadRequestException(
        'Use POST /invoices/:id/issue to issue an invoice',
      );
    }
    try {
      assertInvoiceTransition(existing.status, dto.toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    await this.db.transaction(async (tx) => {
      await tx
        .update(invoices)
        .set({
          status: dto.toStatus,
          updated_at: nowMysqlDateTime(),
          updated_by: user?.id ?? null,
        })
        .where(eq(invoices.id, id));

      if (dto.toStatus === INVOICE_STATUS.CANCELLED) {
        await this.accountsLedger.closeReceivableForCancelledInvoice(id, tx);
      }
    });

    return this.findOne(id, currentOrganizationId, user);
  }

  // --- Items ---

  async listItems(
    invoiceId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InvoiceItemResponseDto[]> {
    await this.requireInvoiceAccess(invoiceId, currentOrganizationId, user);
    const rows = await this.loadItems(invoiceId);
    return rows.map(toInvoiceItemResponse);
  }

  async addItem(
    invoiceId: string,
    dto: CreateInvoiceItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InvoiceItemResponseDto> {
    const invoice = await this.requireInvoiceAccess(
      invoiceId,
      currentOrganizationId,
      user,
    );
    this.assertItemsEditable(invoice.status);
    const itemId = await this.insertItem(
      invoiceId,
      invoice.organization_id,
      dto,
    );
    await this.recalculateTotals(invoiceId, user?.id ?? null);
    return this.findItem(invoiceId, itemId);
  }

  async updateItem(
    invoiceId: string,
    itemId: string,
    dto: UpdateInvoiceItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InvoiceItemResponseDto> {
    const invoice = await this.requireInvoiceAccess(
      invoiceId,
      currentOrganizationId,
      user,
    );
    this.assertItemsEditable(invoice.status);
    const existing = await this.requireItem(invoiceId, itemId);

    const quantity = dto.quantity ?? existing.quantity;
    const unitPrice = dto.unitPrice ?? existing.unit_price;
    const taxId = dto.taxId !== undefined ? dto.taxId : existing.tax_id;

    if (dto.productId !== undefined || dto.serviceId !== undefined) {
      await this.ensureCatalogRefsInOrg(
        invoice.organization_id,
        dto.productId !== undefined ? dto.productId : existing.product_id,
        dto.serviceId !== undefined ? dto.serviceId : existing.service_id,
      );
    }

    const taxRate = await this.resolveTaxRate(
      taxId,
      invoice.organization_id,
    );
    const { lineTotal } = computeLineTotals({
      quantity,
      unitPrice,
      taxRatePercent: taxRate,
    });

    const patch: Partial<{
      product_id: string | null;
      service_id: string | null;
      description: string | null;
      quantity: string;
      unit_price: string;
      tax_id: string | null;
      line_total: string;
      updated_at: string;
    }> = {
      line_total: lineTotal,
      updated_at: nowMysqlDateTime(),
    };

    if (dto.productId !== undefined) patch.product_id = dto.productId;
    if (dto.serviceId !== undefined) patch.service_id = dto.serviceId;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.quantity !== undefined) {
      patch.quantity = formatDecimal(Number(dto.quantity));
    }
    if (dto.unitPrice !== undefined) {
      patch.unit_price = formatDecimal(Number(dto.unitPrice));
    }
    if (dto.taxId !== undefined) patch.tax_id = dto.taxId;

    try {
      await this.db
        .update(invoice_items)
        .set(patch)
        .where(eq(invoice_items.id, itemId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid product, service or tax reference');
    }

    await this.recalculateTotals(invoiceId, user?.id ?? null);
    return this.findItem(invoiceId, itemId);
  }

  async removeItem(
    invoiceId: string,
    itemId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const invoice = await this.requireInvoiceAccess(
      invoiceId,
      currentOrganizationId,
      user,
    );
    this.assertItemsEditable(invoice.status);
    await this.requireItem(invoiceId, itemId);
    await this.db
      .delete(invoice_items)
      .where(eq(invoice_items.id, itemId));
    await this.recalculateTotals(invoiceId, user?.id ?? null);
  }

  // --- Private ---

  private async findItem(
    invoiceId: string,
    itemId: string,
  ): Promise<InvoiceItemResponseDto> {
    const row = await this.requireItem(invoiceId, itemId);
    return toInvoiceItemResponse(row);
  }

  private async requireItem(
    invoiceId: string,
    itemId: string,
  ): Promise<InvoiceItemRow> {
    const [row] = await this.db
      .select()
      .from(invoice_items)
      .where(
        and(
          eq(invoice_items.id, itemId),
          eq(invoice_items.invoice_id, invoiceId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Invoice item ${itemId} not found`);
    }
    return row as InvoiceItemRow;
  }

  private async loadItems(invoiceId: string): Promise<InvoiceItemRow[]> {
    const rows = await this.db
      .select()
      .from(invoice_items)
      .where(eq(invoice_items.invoice_id, invoiceId))
      .orderBy(asc(invoice_items.created_at), asc(invoice_items.id));
    return rows as InvoiceItemRow[];
  }

  private async insertItem(
    invoiceId: string,
    organizationId: string,
    dto: CreateInvoiceItemDto,
    db: DrizzleDB | Tx = this.db,
  ): Promise<string> {
    this.assertItemHasContent(dto);
    await this.ensureCatalogRefsInOrg(
      organizationId,
      dto.productId ?? null,
      dto.serviceId ?? null,
      db,
    );
    const quantity = formatDecimal(Number(dto.quantity ?? '1'));
    const unitPrice = formatDecimal(Number(dto.unitPrice ?? '0'));
    const taxRate = await this.resolveTaxRate(
      dto.taxId ?? null,
      organizationId,
      db,
    );
    const { lineTotal } = computeLineTotals({
      quantity,
      unitPrice,
      taxRatePercent: taxRate,
    });

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await db.insert(invoice_items).values({
        id,
        invoice_id: invoiceId,
        product_id: dto.productId ?? null,
        service_id: dto.serviceId ?? null,
        description: dto.description ?? null,
        quantity,
        unit_price: unitPrice,
        tax_id: dto.taxId ?? null,
        line_total: lineTotal,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid product, service or tax reference');
    }
    return id;
  }

  private async recalculateTotals(
    invoiceId: string,
    updatedBy?: string | null,
    db: DrizzleDB | Tx = this.db,
  ): Promise<void> {
    const items = (await db
      .select()
      .from(invoice_items)
      .where(eq(invoice_items.invoice_id, invoiceId))) as InvoiceItemRow[];

    const [invoice] = await db
      .select({ organization_id: invoices.organization_id })
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    const lines: Array<{ lineTotal: string; lineTax: string }> = [];
    for (const item of items) {
      const taxRate = await this.resolveTaxRate(
        item.tax_id,
        invoice!.organization_id,
        db,
      );
      const computed = computeLineTotals({
        quantity: item.quantity,
        unitPrice: item.unit_price,
        taxRatePercent: taxRate,
      });
      lines.push({
        lineTotal: item.line_total,
        lineTax: computed.lineTax,
      });
    }

    const totals = computeHeaderTotals(lines);
    await db
      .update(invoices)
      .set({
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        total_amount: totals.totalAmount,
        updated_at: nowMysqlDateTime(),
        ...(updatedBy !== undefined ? { updated_by: updatedBy } : {}),
      })
      .where(eq(invoices.id, invoiceId));
  }

  private async resolveTaxRate(
    taxId: string | null | undefined,
    organizationId: string,
    db: DrizzleDB | Tx = this.db,
  ): Promise<string | null> {
    if (!taxId) return null;
    const [row] = await db
      .select({
        id: taxes.id,
        rate: taxes.rate,
        organization_id: taxes.organization_id,
        deleted_at: taxes.deleted_at,
      })
      .from(taxes)
      .where(eq(taxes.id, taxId))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new BadRequestException(`Tax ${taxId} not found`);
    }
    if (row.organization_id != null && row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Tax must be global or belong to the same organization',
      );
    }
    return row.rate;
  }

  private assertHeaderEditable(status: InvoiceStatus): void {
    if (status !== INVOICE_STATUS.DRAFT) {
      throw new BadRequestException(
        'Invoice header can only be updated while status is draft',
      );
    }
  }

  private assertItemsEditable(status: InvoiceStatus): void {
    if (status !== INVOICE_STATUS.DRAFT) {
      throw new BadRequestException(
        'Invoice items can only be mutated while status is draft',
      );
    }
  }

  private assertItemHasContent(
    dto: Pick<
      CreateInvoiceItemDto,
      'productId' | 'serviceId' | 'description'
    >,
  ): void {
    const hasProduct = dto.productId != null && dto.productId !== '';
    const hasService = dto.serviceId != null && dto.serviceId !== '';
    const hasDescription =
      dto.description != null && dto.description.trim() !== '';
    if (!hasProduct && !hasService && !hasDescription) {
      throw new BadRequestException(
        'Item requires at least one of productId, serviceId or description',
      );
    }
  }

  private async requireInvoiceAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InvoiceRow> {
    const [row] = await this.db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'invoice',
    );
    return row as InvoiceRow;
  }

  private async ensureCustomerInOrg(
    customerId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: customers.id, organization_id: customers.organization_id })
      .from(customers)
      .where(and(eq(customers.id, customerId), isNull(customers.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Customer must belong to the same organization',
      );
    }
  }

  private async ensureSalesOrderLinkable(
    salesOrderId: string,
    organizationId: string,
    customerId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: sales_orders.id,
        organization_id: sales_orders.organization_id,
        customer_id: sales_orders.customer_id,
      })
      .from(sales_orders)
      .where(
        and(
          eq(sales_orders.id, salesOrderId),
          isNull(sales_orders.deleted_at),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Sales order ${salesOrderId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Sales order must belong to the same organization',
      );
    }
    if (row.customer_id !== customerId) {
      throw new BadRequestException(
        'Sales order customer must match the invoice customer',
      );
    }
  }

  private async ensureCurrencyExists(currencyId: string): Promise<void> {
    const [row] = await this.db
      .select({ id: currencies.id })
      .from(currencies)
      .where(eq(currencies.id, currencyId))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Currency ${currencyId} not found`);
    }
  }

  private async ensureCatalogRefsInOrg(
    organizationId: string,
    productId: string | null,
    serviceId: string | null,
    db: DrizzleDB | Tx = this.db,
  ): Promise<void> {
    if (productId) {
      const [row] = await db
        .select({
          id: products.id,
          organization_id: products.organization_id,
        })
        .from(products)
        .where(and(eq(products.id, productId), isNull(products.deleted_at)))
        .limit(1);
      if (!row) {
        throw new NotFoundException(`Product ${productId} not found`);
      }
      if (row.organization_id !== organizationId) {
        throw new BadRequestException(
          'Product must belong to the same organization',
        );
      }
    }
    if (serviceId) {
      const [row] = await db
        .select({
          id: services.id,
          organization_id: services.organization_id,
        })
        .from(services)
        .where(and(eq(services.id, serviceId), isNull(services.deleted_at)))
        .limit(1);
      if (!row) {
        throw new NotFoundException(`Service ${serviceId} not found`);
      }
      if (row.organization_id !== organizationId) {
        throw new BadRequestException(
          'Service must belong to the same organization',
        );
      }
    }
  }
}
