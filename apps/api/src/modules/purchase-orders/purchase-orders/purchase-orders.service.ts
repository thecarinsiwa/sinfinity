import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
  products,
  procurement_quote_items,
  procurement_quotes,
  procurement_requests,
  purchase_order_items,
  purchase_order_status_history,
  purchase_orders,
  suppliers,
} from '../../../database/schema';
import { PROCUREMENT_QUOTE_STATUS } from '../../procurement/procurement-quotes/procurement-quote-statuses';
import {
  isMysqlDuplicateError,
  throwDuplicateOrRethrow,
  throwFkOrRethrow,
} from '../../settings/utils/mysql-errors';
import {
  nowMysqlDateTime,
  todayMysqlDate,
} from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../purchase-orders-scope';
import {
  computeHeaderTotals,
  computeLineTotal,
  formatDecimal,
} from '../purchase-orders-totals';
import { CreatePurchaseOrderFromQuoteDto } from './dto/create-purchase-order-from-quote.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ListPurchaseOrdersQueryDto } from './dto/list-purchase-orders-query.dto';
import {
  CreatePurchaseOrderItemDto,
  PurchaseOrderItemResponseDto,
  UpdatePurchaseOrderItemDto,
} from './dto/purchase-order-item.dto';
import { PurchaseOrderResponseDto } from './dto/purchase-order-response.dto';
import { PurchaseOrderStatusHistoryResponseDto } from './dto/purchase-order-status-history.dto';
import { TransitionPurchaseOrderDto } from './dto/transition-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import {
  assertPurchaseOrderTransition,
  assertReceiptQtyInvariants,
  PURCHASE_ORDER_STATUS,
  type PurchaseOrderStatus,
} from './purchase-order-statuses';
import {
  toPurchaseOrderItemResponse,
  toPurchaseOrderResponse,
  toPurchaseOrderStatusHistoryResponse,
  type PurchaseOrderItemRow,
  type PurchaseOrderRow,
  type PurchaseOrderStatusHistoryRow,
} from './purchase-orders.mapper';

type Tx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];

@Injectable()
export class PurchaseOrdersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListPurchaseOrdersQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<PurchaseOrderResponseDto>> {
    const {
      page,
      pageSize,
      search,
      organizationId,
      status,
      supplierId,
      procurementQuoteId,
      buyerUserId,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      search,
      status,
      supplierId,
      procurementQuoteId,
      buyerUserId,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(purchase_orders).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(purchase_orders)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(purchase_orders.created_at), asc(purchase_orders.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as PurchaseOrderRow[]).map((row) => toPurchaseOrderResponse(row)),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PurchaseOrderResponseDto> {
    const row = await this.requireOrderAccess(
      id,
      currentOrganizationId,
      user,
    );
    const items = await this.loadItems(id);
    return toPurchaseOrderResponse(
      row,
      items.map(toPurchaseOrderItemResponse),
    );
  }

  async create(
    dto: CreatePurchaseOrderDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PurchaseOrderResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'purchase order',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureSupplierInOrg(dto.supplierId, organizationId);
    await this.ensureProcurementLinksInOrg(
      organizationId,
      dto.procurementRequestId,
      dto.procurementQuoteId,
    );

    const id = createId();
    const now = nowMysqlDateTime();

    try {
      await this.db.insert(purchase_orders).values({
        id,
        organization_id: organizationId,
        po_number: dto.poNumber.trim(),
        supplier_id: dto.supplierId,
        procurement_request_id: dto.procurementRequestId ?? null,
        procurement_quote_id: dto.procurementQuoteId ?? null,
        status: PURCHASE_ORDER_STATUS.DRAFT,
        order_date: dto.orderDate
          ? dto.orderDate.slice(0, 10)
          : todayMysqlDate(),
        expected_date: dto.expectedDate
          ? dto.expectedDate.slice(0, 10)
          : null,
        currency_id: dto.currencyId ?? null,
        shipping_term_id: dto.shippingTermId ?? null,
        payment_term_id: dto.paymentTermId ?? null,
        subtotal: '0.0000',
        tax_amount: '0.0000',
        total_amount: '0.0000',
        buyer_user_id: dto.buyerUserId ?? user?.id ?? null,
        created_at: now,
        updated_at: now,
        created_by: user?.id ?? null,
        updated_by: user?.id ?? null,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'PO number already exists for this organization',
        );
      }
      throwFkOrRethrow(
        error,
        'Invalid supplier, currency, shipping term, payment term or buyer reference',
      );
    }

    await this.insertStatusHistory(
      this.db,
      id,
      null,
      PURCHASE_ORDER_STATUS.DRAFT,
      user?.id ?? null,
    );

    if (dto.items?.length) {
      for (const item of dto.items) {
        await this.insertItem(id, organizationId, item);
      }
      await this.recalculateTotals(id, user?.id ?? null);
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async createFromQuote(
    dto: CreatePurchaseOrderFromQuoteDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PurchaseOrderResponseDto> {
    const orderId = await this.db.transaction(async (tx) => {
      const [quote] = await tx
        .select({
          id: procurement_quotes.id,
          procurement_request_id: procurement_quotes.procurement_request_id,
          supplier_id: procurement_quotes.supplier_id,
          currency_id: procurement_quotes.currency_id,
          shipping_term_id: procurement_quotes.shipping_term_id,
          status: procurement_quotes.status,
        })
        .from(procurement_quotes)
        .where(eq(procurement_quotes.id, dto.procurementQuoteId))
        .limit(1);

      if (!quote) {
        throw new NotFoundException(
          `Procurement quote ${dto.procurementQuoteId} not found`,
        );
      }
      if (quote.status !== PROCUREMENT_QUOTE_STATUS.SELECTED) {
        throw new BadRequestException(
          'Only a selected procurement quote can be converted to a purchase order',
        );
      }

      const [request] = await tx
        .select({
          id: procurement_requests.id,
          organization_id: procurement_requests.organization_id,
          deleted_at: procurement_requests.deleted_at,
        })
        .from(procurement_requests)
        .where(eq(procurement_requests.id, quote.procurement_request_id))
        .limit(1);

      if (!request || request.deleted_at != null) {
        throw new NotFoundException(
          `Procurement request ${quote.procurement_request_id} not found`,
        );
      }
      assertOrgAccess(
        request.organization_id,
        currentOrganizationId,
        user,
        'procurement quote',
      );

      const [existingPo] = await tx
        .select({ id: purchase_orders.id })
        .from(purchase_orders)
        .where(
          and(
            eq(purchase_orders.procurement_quote_id, quote.id),
            isNull(purchase_orders.deleted_at),
          ),
        )
        .limit(1);
      if (existingPo) {
        throw new ConflictException(
          'A purchase order already exists for this procurement quote',
        );
      }

      const quoteItems = await tx
        .select()
        .from(procurement_quote_items)
        .where(eq(procurement_quote_items.procurement_quote_id, quote.id))
        .orderBy(
          asc(procurement_quote_items.created_at),
          asc(procurement_quote_items.id),
        );

      const id = createId();
      const now = nowMysqlDateTime();
      const lineTotals = quoteItems.map((item) => item.line_total);
      const totals = computeHeaderTotals(lineTotals);

      try {
        await tx.insert(purchase_orders).values({
          id,
          organization_id: request.organization_id,
          po_number: dto.poNumber.trim(),
          supplier_id: quote.supplier_id,
          procurement_request_id: quote.procurement_request_id,
          procurement_quote_id: quote.id,
          status: PURCHASE_ORDER_STATUS.DRAFT,
          order_date: dto.orderDate
            ? dto.orderDate.slice(0, 10)
            : todayMysqlDate(),
          expected_date: dto.expectedDate
            ? dto.expectedDate.slice(0, 10)
            : null,
          currency_id: quote.currency_id,
          shipping_term_id: quote.shipping_term_id,
          payment_term_id: dto.paymentTermId ?? null,
          subtotal: totals.subtotal,
          tax_amount: totals.taxAmount,
          total_amount: totals.totalAmount,
          buyer_user_id: dto.buyerUserId ?? user?.id ?? null,
          created_at: now,
          updated_at: now,
          created_by: user?.id ?? null,
          updated_by: user?.id ?? null,
        });
      } catch (error) {
        if (isMysqlDuplicateError(error)) {
          throwDuplicateOrRethrow(
            error,
            'PO number already exists for this organization',
          );
        }
        throwFkOrRethrow(
          error,
          'Invalid payment term or buyer reference',
        );
      }

      await this.insertStatusHistory(
        tx,
        id,
        null,
        PURCHASE_ORDER_STATUS.DRAFT,
        user?.id ?? null,
      );

      for (const item of quoteItems) {
        await tx.insert(purchase_order_items).values({
          id: createId(),
          purchase_order_id: id,
          product_id: item.product_id,
          description: item.notes,
          quantity: item.quantity,
          quantity_received: '0.0000',
          unit_price: item.unit_price,
          line_total: item.line_total,
          created_at: now,
          updated_at: now,
        });
      }

      return id;
    });

    return this.findOne(orderId, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdatePurchaseOrderDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PurchaseOrderResponseDto> {
    const existing = await this.requireOrderAccess(
      id,
      currentOrganizationId,
      user,
    );
    this.assertHeaderEditable(existing.status);

    if (dto.supplierId !== undefined) {
      await this.ensureSupplierInOrg(
        dto.supplierId,
        existing.organization_id,
      );
    }

    const patch: Partial<{
      po_number: string;
      supplier_id: string;
      order_date: string;
      expected_date: string | null;
      currency_id: string | null;
      shipping_term_id: string | null;
      payment_term_id: string | null;
      buyer_user_id: string | null;
      updated_at: string;
      updated_by: string | null;
    }> = {
      updated_at: nowMysqlDateTime(),
      updated_by: user?.id ?? null,
    };

    if (dto.poNumber !== undefined) patch.po_number = dto.poNumber.trim();
    if (dto.supplierId !== undefined) patch.supplier_id = dto.supplierId;
    if (dto.orderDate !== undefined)
      patch.order_date = dto.orderDate.slice(0, 10);
    if (dto.expectedDate !== undefined) {
      patch.expected_date =
        dto.expectedDate != null ? dto.expectedDate.slice(0, 10) : null;
    }
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.shippingTermId !== undefined)
      patch.shipping_term_id = dto.shippingTermId;
    if (dto.paymentTermId !== undefined)
      patch.payment_term_id = dto.paymentTermId;
    if (dto.buyerUserId !== undefined) patch.buyer_user_id = dto.buyerUserId;

    try {
      await this.db
        .update(purchase_orders)
        .set(patch)
        .where(eq(purchase_orders.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'PO number already exists for this organization',
        );
      }
      throwFkOrRethrow(
        error,
        'Invalid supplier, currency, shipping term, payment term or buyer reference',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireOrderAccess(id, currentOrganizationId, user);
    await this.db
      .update(purchase_orders)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(purchase_orders.id, id));
  }

  async listItems(
    orderId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PurchaseOrderItemResponseDto[]> {
    await this.requireOrderAccess(orderId, currentOrganizationId, user);
    const rows = await this.loadItems(orderId);
    return rows.map(toPurchaseOrderItemResponse);
  }

  async addItem(
    orderId: string,
    dto: CreatePurchaseOrderItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PurchaseOrderItemResponseDto> {
    const order = await this.requireOrderAccess(
      orderId,
      currentOrganizationId,
      user,
    );
    this.assertItemsEditable(order.status);
    const itemId = await this.insertItem(
      orderId,
      order.organization_id,
      dto,
    );
    await this.recalculateTotals(orderId, user?.id ?? null);
    return this.findItem(orderId, itemId);
  }

  async updateItem(
    orderId: string,
    itemId: string,
    dto: UpdatePurchaseOrderItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PurchaseOrderItemResponseDto> {
    const order = await this.requireOrderAccess(
      orderId,
      currentOrganizationId,
      user,
    );
    this.assertItemsEditable(order.status);
    const existing = await this.requireItem(orderId, itemId);

    const nextProductId =
      dto.productId !== undefined ? dto.productId : existing.product_id;
    const nextDescription =
      dto.description !== undefined ? dto.description : existing.description;
    this.assertItemHasContent({
      productId: nextProductId,
      description: nextDescription,
    });

    if (dto.productId !== undefined && dto.productId != null) {
      await this.ensureProductInOrg(dto.productId, order.organization_id);
    }

    const quantity = dto.quantity ?? existing.quantity;
    const unitPrice = dto.unitPrice ?? existing.unit_price;
    const lineTotal = computeLineTotal(quantity, unitPrice);

    const patch: Partial<{
      product_id: string | null;
      description: string | null;
      quantity: string;
      unit_price: string;
      line_total: string;
      updated_at: string;
    }> = {
      line_total: lineTotal,
      updated_at: nowMysqlDateTime(),
    };

    if (dto.productId !== undefined) patch.product_id = dto.productId;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.quantity !== undefined)
      patch.quantity = formatDecimal(Number(dto.quantity));
    if (dto.unitPrice !== undefined)
      patch.unit_price = formatDecimal(Number(dto.unitPrice));

    try {
      await this.db
        .update(purchase_order_items)
        .set(patch)
        .where(eq(purchase_order_items.id, itemId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid product reference');
    }

    await this.recalculateTotals(orderId, user?.id ?? null);
    return this.findItem(orderId, itemId);
  }

  async removeItem(
    orderId: string,
    itemId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const order = await this.requireOrderAccess(
      orderId,
      currentOrganizationId,
      user,
    );
    this.assertItemsEditable(order.status);
    await this.requireItem(orderId, itemId);
    await this.db
      .delete(purchase_order_items)
      .where(eq(purchase_order_items.id, itemId));
    await this.recalculateTotals(orderId, user?.id ?? null);
  }

  // --- Workflow ---

  async transition(
    id: string,
    dto: TransitionPurchaseOrderDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PurchaseOrderResponseDto> {
    const order = await this.requireOrderAccess(
      id,
      currentOrganizationId,
      user,
    );
    const fromStatus = order.status;
    const toStatus = dto.toStatus;

    try {
      assertPurchaseOrderTransition(fromStatus, toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    if (
      fromStatus === PURCHASE_ORDER_STATUS.DRAFT &&
      toStatus === PURCHASE_ORDER_STATUS.SENT
    ) {
      const granted = user?.permissions;
      if (
        granted !== undefined &&
        !granted.includes('purchase_orders.send')
      ) {
        throw new ForbiddenException(
          'Missing permissions: purchase_orders.send',
        );
      }
    }

    if (
      toStatus === PURCHASE_ORDER_STATUS.PARTIAL ||
      toStatus === PURCHASE_ORDER_STATUS.RECEIVED
    ) {
      const items = await this.loadItems(id);
      try {
        assertReceiptQtyInvariants(
          toStatus,
          items.map((item) => ({
            quantity: item.quantity,
            quantityReceived: item.quantity_received,
          })),
        );
      } catch (error) {
        throw new BadRequestException(
          error instanceof Error
            ? error.message
            : 'Receipt quantity invariants failed',
        );
      }
    }

    await this.db
      .update(purchase_orders)
      .set({
        status: toStatus,
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(purchase_orders.id, id));

    await this.insertStatusHistory(
      this.db,
      id,
      fromStatus,
      toStatus,
      user?.id ?? null,
      dto.notes,
    );

    return this.findOne(id, currentOrganizationId, user);
  }

  async listStatusHistory(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PurchaseOrderStatusHistoryResponseDto[]> {
    await this.requireOrderAccess(id, currentOrganizationId, user);
    const rows = await this.db
      .select()
      .from(purchase_order_status_history)
      .where(eq(purchase_order_status_history.purchase_order_id, id))
      .orderBy(
        asc(purchase_order_status_history.changed_at),
        asc(purchase_order_status_history.id),
      );
    return (rows as PurchaseOrderStatusHistoryRow[]).map(
      toPurchaseOrderStatusHistoryResponse,
    );
  }

  private async insertItem(
    orderId: string,
    organizationId: string,
    dto: CreatePurchaseOrderItemDto,
  ): Promise<string> {
    this.assertItemHasContent(dto);
    if (dto.productId) {
      await this.ensureProductInOrg(dto.productId, organizationId);
    }

    const quantity = formatDecimal(Number(dto.quantity ?? '1'));
    const unitPrice = formatDecimal(Number(dto.unitPrice ?? '0'));
    const lineTotal = computeLineTotal(quantity, unitPrice);
    const id = createId();
    const now = nowMysqlDateTime();

    try {
      await this.db.insert(purchase_order_items).values({
        id,
        purchase_order_id: orderId,
        product_id: dto.productId ?? null,
        description: dto.description ?? null,
        quantity,
        quantity_received: '0.0000',
        unit_price: unitPrice,
        line_total: lineTotal,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid product reference');
    }
    return id;
  }

  private async recalculateTotals(
    orderId: string,
    updatedBy: string | null,
  ): Promise<void> {
    const items = await this.loadItems(orderId);
    const totals = computeHeaderTotals(items.map((item) => item.line_total));
    await this.db
      .update(purchase_orders)
      .set({
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        total_amount: totals.totalAmount,
        updated_at: nowMysqlDateTime(),
        updated_by: updatedBy,
      })
      .where(eq(purchase_orders.id, orderId));
  }

  private async insertStatusHistory(
    db: DrizzleDB | Tx,
    orderId: string,
    fromStatus: string | null,
    toStatus: string,
    changedBy: string | null,
    notes?: string | null,
  ): Promise<void> {
    await db.insert(purchase_order_status_history).values({
      id: createId(),
      purchase_order_id: orderId,
      from_status: fromStatus,
      to_status: toStatus,
      changed_by: changedBy,
      changed_at: nowMysqlDateTime(),
      notes: notes ?? null,
    });
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
    status?: PurchaseOrderStatus;
    supplierId?: string;
    procurementQuoteId?: string;
    buyerUserId?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(purchase_orders.organization_id, params.organizationId),
      isNull(purchase_orders.deleted_at),
    ];
    if (params.status) {
      parts.push(eq(purchase_orders.status, params.status));
    }
    if (params.supplierId) {
      parts.push(eq(purchase_orders.supplier_id, params.supplierId));
    }
    if (params.procurementQuoteId) {
      parts.push(
        eq(purchase_orders.procurement_quote_id, params.procurementQuoteId),
      );
    }
    if (params.buyerUserId) {
      parts.push(eq(purchase_orders.buyer_user_id, params.buyerUserId));
    }
    if (params.search?.trim()) {
      const term = `%${params.search.trim()}%`;
      parts.push(like(purchase_orders.po_number, term));
    }
    return and(...parts)!;
  }

  private async findItem(
    orderId: string,
    itemId: string,
  ): Promise<PurchaseOrderItemResponseDto> {
    const row = await this.requireItem(orderId, itemId);
    return toPurchaseOrderItemResponse(row);
  }

  private async requireItem(
    orderId: string,
    itemId: string,
  ): Promise<PurchaseOrderItemRow> {
    const [row] = await this.db
      .select()
      .from(purchase_order_items)
      .where(
        and(
          eq(purchase_order_items.id, itemId),
          eq(purchase_order_items.purchase_order_id, orderId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Purchase order item ${itemId} not found`);
    }
    return row as PurchaseOrderItemRow;
  }

  private async loadItems(orderId: string): Promise<PurchaseOrderItemRow[]> {
    const rows = await this.db
      .select()
      .from(purchase_order_items)
      .where(eq(purchase_order_items.purchase_order_id, orderId))
      .orderBy(
        asc(purchase_order_items.created_at),
        asc(purchase_order_items.id),
      );
    return rows as PurchaseOrderItemRow[];
  }

  private async requireOrderAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PurchaseOrderRow> {
    const [row] = await this.db
      .select()
      .from(purchase_orders)
      .where(
        and(eq(purchase_orders.id, id), isNull(purchase_orders.deleted_at)),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Purchase order ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'purchase order',
    );
    return row as PurchaseOrderRow;
  }

  private assertHeaderEditable(status: PurchaseOrderStatus): void {
    if (
      status === PURCHASE_ORDER_STATUS.CLOSED ||
      status === PURCHASE_ORDER_STATUS.CANCELLED
    ) {
      throw new BadRequestException(
        'Purchase order header cannot be edited while closed or cancelled',
      );
    }
  }

  private assertItemsEditable(status: PurchaseOrderStatus): void {
    if (status !== PURCHASE_ORDER_STATUS.DRAFT) {
      throw new BadRequestException(
        'Purchase order items can only be mutated while draft',
      );
    }
  }

  private assertItemHasContent(
    dto: Pick<CreatePurchaseOrderItemDto, 'productId' | 'description'>,
  ): void {
    const hasProduct = dto.productId != null && dto.productId !== '';
    const hasDescription =
      dto.description != null && dto.description.trim() !== '';
    if (!hasProduct && !hasDescription) {
      throw new BadRequestException(
        'Item requires at least one of productId or description',
      );
    }
  }

  private async ensureSupplierInOrg(
    supplierId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: suppliers.id,
        organization_id: suppliers.organization_id,
      })
      .from(suppliers)
      .where(and(eq(suppliers.id, supplierId), isNull(suppliers.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Supplier must belong to the same organization',
      );
    }
  }

  private async ensureProductInOrg(
    productId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
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

  private async ensureProcurementLinksInOrg(
    organizationId: string,
    requestId?: string | null,
    quoteId?: string | null,
  ): Promise<void> {
    if (requestId) {
      const [row] = await this.db
        .select({
          id: procurement_requests.id,
          organization_id: procurement_requests.organization_id,
        })
        .from(procurement_requests)
        .where(
          and(
            eq(procurement_requests.id, requestId),
            isNull(procurement_requests.deleted_at),
          ),
        )
        .limit(1);
      if (!row) {
        throw new NotFoundException(
          `Procurement request ${requestId} not found`,
        );
      }
      if (row.organization_id !== organizationId) {
        throw new BadRequestException(
          'Procurement request must belong to the same organization',
        );
      }
    }
    if (quoteId) {
      const [quote] = await this.db
        .select({
          id: procurement_quotes.id,
          procurement_request_id: procurement_quotes.procurement_request_id,
        })
        .from(procurement_quotes)
        .where(eq(procurement_quotes.id, quoteId))
        .limit(1);
      if (!quote) {
        throw new NotFoundException(`Procurement quote ${quoteId} not found`);
      }
      await this.ensureProcurementLinksInOrg(
        organizationId,
        quote.procurement_request_id,
        null,
      );
    }
  }
}
