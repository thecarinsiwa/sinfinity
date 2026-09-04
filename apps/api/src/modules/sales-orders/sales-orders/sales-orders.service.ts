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
  or,
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
  customer_addresses,
  customers,
  products,
  quotation_items,
  quotation_statuses,
  quotations,
  sales_order_items,
  sales_order_status_history,
  sales_orders,
  services,
  taxes,
} from '../../../database/schema';
import { QUOTATION_STATUS_CODE } from '../../quotations/quotation-statuses/quotation-statuses.catalog';
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
} from '../sales-orders-scope';
import {
  computeHeaderTotals,
  computeLineTotals,
  formatDecimal,
} from '../sales-orders-totals';
import { ConvertQuotationToOrderDto } from './dto/convert-quotation-to-order.dto';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { ListSalesOrdersQueryDto } from './dto/list-sales-orders-query.dto';
import {
  CreateSalesOrderItemDto,
  SalesOrderItemResponseDto,
  UpdateSalesOrderItemDto,
} from './dto/sales-order-item.dto';
import { SalesOrderResponseDto } from './dto/sales-order-response.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { SalesOrderStatusHistoryResponseDto } from './dto/sales-order-status-history.dto';
import { TransitionSalesOrderDto } from './dto/transition-sales-order.dto';
import {
  assertDeliveryQtyInvariants,
  assertSalesOrderTransition,
  SALES_ORDER_STATUS,
  type SalesOrderStatus,
} from './sales-order-statuses';
import {
  toSalesOrderItemResponse,
  toSalesOrderResponse,
  toSalesOrderStatusHistoryResponse,
  type SalesOrderItemRow,
  type SalesOrderRow,
  type SalesOrderStatusHistoryRow,
} from './sales-orders.mapper';

type Tx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];

@Injectable()
export class SalesOrdersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListSalesOrdersQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<SalesOrderResponseDto>> {
    const {
      page,
      pageSize,
      search,
      organizationId,
      status,
      customerId,
      quotationId,
      ownerUserId,
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
      customerId,
      quotationId,
      ownerUserId,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(sales_orders).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(sales_orders)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(sales_orders.created_at), asc(sales_orders.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as SalesOrderRow[]).map((row) => toSalesOrderResponse(row)),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesOrderResponseDto> {
    const row = await this.requireOrderAccess(id, currentOrganizationId, user);
    const items = await this.loadItems(id);
    return toSalesOrderResponse(
      row,
      items.map(toSalesOrderItemResponse),
    );
  }

  async create(
    dto: CreateSalesOrderDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesOrderResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'sales order',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureCustomerInOrg(dto.customerId, organizationId);
    if (dto.quotationId) {
      await this.ensureQuotationLinkable(
        dto.quotationId,
        organizationId,
        dto.customerId,
      );
    }
    await this.ensureAddressInCustomer(
      dto.billingAddressId,
      dto.customerId,
      organizationId,
    );
    await this.ensureAddressInCustomer(
      dto.shippingAddressId,
      dto.customerId,
      organizationId,
    );

    const id = createId();
    try {
      await this.db.insert(sales_orders).values({
        id,
        organization_id: organizationId,
        order_number: dto.orderNumber.trim(),
        customer_id: dto.customerId,
        quotation_id: dto.quotationId ?? null,
        branch_id: dto.branchId ?? null,
        status: SALES_ORDER_STATUS.PENDING,
        order_date: (dto.orderDate ?? todayMysqlDate()).slice(0, 10),
        requested_delivery_date: dto.requestedDeliveryDate
          ? dto.requestedDeliveryDate.slice(0, 10)
          : null,
        currency_id: dto.currencyId ?? null,
        subtotal: '0.0000',
        tax_amount: '0.0000',
        total_amount: '0.0000',
        billing_address_id: dto.billingAddressId ?? null,
        shipping_address_id: dto.shippingAddressId ?? null,
        owner_user_id: dto.ownerUserId ?? null,
        created_by: user?.id ?? null,
        updated_by: user?.id ?? null,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Order number already exists for this organization',
        );
      }
      throwFkOrRethrow(
        error,
        'Invalid customer, quotation, branch, currency, address or owner reference',
      );
    }

    await this.insertStatusHistory(
      this.db,
      id,
      null,
      SALES_ORDER_STATUS.PENDING,
      user?.id ?? null,
      'Created',
    );

    if (dto.items?.length) {
      for (const item of dto.items) {
        await this.insertItem(id, organizationId, item);
      }
      await this.recalculateTotals(id, user?.id ?? null);
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateSalesOrderDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesOrderResponseDto> {
    const existing = await this.requireOrderAccess(
      id,
      currentOrganizationId,
      user,
    );
    this.assertHeaderEditable(existing.status);

    if (dto.customerId !== undefined) {
      await this.ensureCustomerInOrg(dto.customerId, existing.organization_id);
    }
    const customerId = dto.customerId ?? existing.customer_id;
    if (dto.billingAddressId !== undefined) {
      await this.ensureAddressInCustomer(
        dto.billingAddressId,
        customerId,
        existing.organization_id,
      );
    }
    if (dto.shippingAddressId !== undefined) {
      await this.ensureAddressInCustomer(
        dto.shippingAddressId,
        customerId,
        existing.organization_id,
      );
    }

    const patch: Partial<{
      order_number: string;
      customer_id: string;
      branch_id: string | null;
      order_date: string;
      requested_delivery_date: string | null;
      currency_id: string | null;
      billing_address_id: string | null;
      shipping_address_id: string | null;
      owner_user_id: string | null;
      updated_at: string;
      updated_by: string | null;
    }> = {
      updated_at: nowMysqlDateTime(),
      updated_by: user?.id ?? null,
    };

    if (dto.orderNumber !== undefined)
      patch.order_number = dto.orderNumber.trim();
    if (dto.customerId !== undefined) patch.customer_id = dto.customerId;
    if (dto.branchId !== undefined) patch.branch_id = dto.branchId;
    if (dto.orderDate !== undefined)
      patch.order_date = dto.orderDate.slice(0, 10);
    if (dto.requestedDeliveryDate !== undefined) {
      patch.requested_delivery_date = dto.requestedDeliveryDate
        ? dto.requestedDeliveryDate.slice(0, 10)
        : null;
    }
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.billingAddressId !== undefined)
      patch.billing_address_id = dto.billingAddressId;
    if (dto.shippingAddressId !== undefined)
      patch.shipping_address_id = dto.shippingAddressId;
    if (dto.ownerUserId !== undefined) patch.owner_user_id = dto.ownerUserId;

    try {
      await this.db
        .update(sales_orders)
        .set(patch)
        .where(eq(sales_orders.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Order number already exists for this organization',
        );
      }
      throwFkOrRethrow(
        error,
        'Invalid customer, branch, currency, address or owner reference',
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
      .update(sales_orders)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(sales_orders.id, id));
  }

  // --- Items ---

  async listItems(
    orderId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesOrderItemResponseDto[]> {
    await this.requireOrderAccess(orderId, currentOrganizationId, user);
    const rows = await this.loadItems(orderId);
    return rows.map(toSalesOrderItemResponse);
  }

  async addItem(
    orderId: string,
    dto: CreateSalesOrderItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesOrderItemResponseDto> {
    const order = await this.requireOrderAccess(
      orderId,
      currentOrganizationId,
      user,
    );
    this.assertItemsEditable(order.status);
    this.assertItemHasContent(dto);
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
    dto: UpdateSalesOrderItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesOrderItemResponseDto> {
    const order = await this.requireOrderAccess(
      orderId,
      currentOrganizationId,
      user,
    );
    const existing = await this.requireItem(orderId, itemId);

    const quantityDeliveredOnly =
      dto.quantityDelivered !== undefined &&
      dto.productId === undefined &&
      dto.serviceId === undefined &&
      dto.description === undefined &&
      dto.quantity === undefined &&
      dto.unitPrice === undefined &&
      dto.taxId === undefined;

    if (!quantityDeliveredOnly) {
      this.assertItemsEditable(order.status);
    } else if (
      order.status === SALES_ORDER_STATUS.DELIVERED ||
      order.status === SALES_ORDER_STATUS.CANCELLED
    ) {
      throw new BadRequestException(
        'Cannot update items on a delivered or cancelled sales order',
      );
    }

    const quantity = dto.quantity ?? existing.quantity;
    const unitPrice = dto.unitPrice ?? existing.unit_price;
    const taxId = dto.taxId !== undefined ? dto.taxId : existing.tax_id;
    const quantityDelivered =
      dto.quantityDelivered ?? existing.quantity_delivered;

    if (Number(quantityDelivered) > Number(quantity)) {
      throw new BadRequestException(
        'quantityDelivered cannot exceed quantity',
      );
    }

    if (dto.productId !== undefined || dto.serviceId !== undefined) {
      await this.ensureCatalogRefsInOrg(
        order.organization_id,
        dto.productId !== undefined ? dto.productId : existing.product_id,
        dto.serviceId !== undefined ? dto.serviceId : existing.service_id,
      );
    }

    const taxRate = await this.resolveTaxRate(taxId, order.organization_id);
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
      quantity_delivered: string;
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
    if (dto.quantity !== undefined)
      patch.quantity = formatDecimal(Number(dto.quantity));
    if (dto.quantityDelivered !== undefined)
      patch.quantity_delivered = formatDecimal(Number(dto.quantityDelivered));
    if (dto.unitPrice !== undefined)
      patch.unit_price = formatDecimal(Number(dto.unitPrice));
    if (dto.taxId !== undefined) patch.tax_id = dto.taxId;

    try {
      await this.db
        .update(sales_order_items)
        .set(patch)
        .where(eq(sales_order_items.id, itemId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid product, service or tax reference');
    }

    if (!quantityDeliveredOnly) {
      await this.recalculateTotals(orderId, user?.id ?? null);
    }

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
      .delete(sales_order_items)
      .where(eq(sales_order_items.id, itemId));
    await this.recalculateTotals(orderId, user?.id ?? null);
  }

  // --- Workflow ---

  async transition(
    id: string,
    dto: TransitionSalesOrderDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesOrderResponseDto> {
    const order = await this.requireOrderAccess(
      id,
      currentOrganizationId,
      user,
    );
    const fromStatus = order.status;
    const toStatus = dto.toStatus;

    try {
      assertSalesOrderTransition(fromStatus, toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    if (
      toStatus === SALES_ORDER_STATUS.PARTIALLY_DELIVERED ||
      toStatus === SALES_ORDER_STATUS.DELIVERED
    ) {
      const items = await this.loadItems(id);
      try {
        assertDeliveryQtyInvariants(
          toStatus,
          items.map((item) => ({
            quantity: item.quantity,
            quantityDelivered: item.quantity_delivered,
          })),
        );
      } catch (error) {
        throw new BadRequestException(
          error instanceof Error
            ? error.message
            : 'Delivery quantity invariants failed',
        );
      }
    }

    await this.db
      .update(sales_orders)
      .set({
        status: toStatus,
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(sales_orders.id, id));

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
  ): Promise<SalesOrderStatusHistoryResponseDto[]> {
    await this.requireOrderAccess(id, currentOrganizationId, user);
    const rows = await this.db
      .select()
      .from(sales_order_status_history)
      .where(eq(sales_order_status_history.sales_order_id, id))
      .orderBy(
        asc(sales_order_status_history.changed_at),
        asc(sales_order_status_history.id),
      );
    return (rows as SalesOrderStatusHistoryRow[]).map(
      toSalesOrderStatusHistoryResponse,
    );
  }

  // --- Convert ---

  async convertFromQuotation(
    quotationId: string,
    dto: ConvertQuotationToOrderDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesOrderResponseDto> {
    const orderId = await this.db.transaction(async (tx) => {
      const [quotation] = await tx
        .select({
          id: quotations.id,
          organization_id: quotations.organization_id,
          customer_id: quotations.customer_id,
          currency_id: quotations.currency_id,
          subtotal: quotations.subtotal,
          tax_amount: quotations.tax_amount,
          total_amount: quotations.total_amount,
          owner_user_id: quotations.owner_user_id,
          status_id: quotations.status_id,
          deleted_at: quotations.deleted_at,
        })
        .from(quotations)
        .where(eq(quotations.id, quotationId))
        .limit(1);

      if (!quotation || quotation.deleted_at != null) {
        throw new NotFoundException(`Quotation ${quotationId} not found`);
      }
      assertOrgAccess(
        quotation.organization_id,
        currentOrganizationId,
        user,
        'quotation',
      );

      const [status] = await tx
        .select({ code: quotation_statuses.code })
        .from(quotation_statuses)
        .where(eq(quotation_statuses.id, quotation.status_id!))
        .limit(1);
      if (status?.code !== QUOTATION_STATUS_CODE.ACCEPTED) {
        throw new BadRequestException(
          'Only ACCEPTED quotations can be converted to a sales order',
        );
      }

      const [existingOrder] = await tx
        .select({ id: sales_orders.id })
        .from(sales_orders)
        .where(
          and(
            eq(sales_orders.quotation_id, quotationId),
            isNull(sales_orders.deleted_at),
          ),
        )
        .limit(1);
      if (existingOrder) {
        throw new ConflictException(
          'Quotation already converted to a sales order',
        );
      }

      const billingAddressId =
        dto.billingAddressId !== undefined
          ? dto.billingAddressId
          : await this.resolveDefaultAddress(
              tx,
              quotation.customer_id,
              'billing',
            );
      const shippingAddressId =
        dto.shippingAddressId !== undefined
          ? dto.shippingAddressId
          : await this.resolveDefaultAddress(
              tx,
              quotation.customer_id,
              'shipping',
            );

      if (billingAddressId) {
        await this.ensureAddressInCustomer(
          billingAddressId,
          quotation.customer_id,
          quotation.organization_id,
          tx,
        );
      }
      if (shippingAddressId) {
        await this.ensureAddressInCustomer(
          shippingAddressId,
          quotation.customer_id,
          quotation.organization_id,
          tx,
        );
      }

      const id = createId();
      try {
        await tx.insert(sales_orders).values({
          id,
          organization_id: quotation.organization_id,
          order_number: dto.orderNumber.trim(),
          customer_id: quotation.customer_id,
          quotation_id: quotation.id,
          branch_id: dto.branchId ?? null,
          status: SALES_ORDER_STATUS.PENDING,
          order_date: (dto.orderDate ?? todayMysqlDate()).slice(0, 10),
          requested_delivery_date: dto.requestedDeliveryDate
            ? dto.requestedDeliveryDate.slice(0, 10)
            : null,
          currency_id: quotation.currency_id,
          subtotal: quotation.subtotal,
          tax_amount: quotation.tax_amount,
          total_amount: quotation.total_amount,
          billing_address_id: billingAddressId,
          shipping_address_id: shippingAddressId,
          owner_user_id: dto.ownerUserId ?? quotation.owner_user_id,
          created_by: user?.id ?? null,
          updated_by: user?.id ?? null,
        });
      } catch (error) {
        if (isMysqlDuplicateError(error)) {
          throwDuplicateOrRethrow(
            error,
            'Order number already exists for this organization',
          );
        }
        throwFkOrRethrow(
          error,
          'Invalid branch, address or owner reference',
        );
      }

      await this.insertStatusHistory(
        tx,
        id,
        null,
        SALES_ORDER_STATUS.PENDING,
        user?.id ?? null,
        'Converted from quotation',
      );

      const qItems = await tx
        .select()
        .from(quotation_items)
        .where(eq(quotation_items.quotation_id, quotationId))
        .orderBy(asc(quotation_items.line_number), asc(quotation_items.id));

      for (const item of qItems) {
        await tx.insert(sales_order_items).values({
          id: createId(),
          sales_order_id: id,
          product_id: item.product_id,
          service_id: item.service_id,
          description: item.description,
          quantity: item.quantity,
          quantity_delivered: '0.0000',
          unit_price: item.unit_price,
          tax_id: item.tax_id,
          line_total: item.line_total,
        });
      }

      return id;
    });

    return this.findOne(orderId, currentOrganizationId, user);
  }

  private async insertItem(
    orderId: string,
    organizationId: string,
    dto: CreateSalesOrderItemDto,
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
    try {
      await db.insert(sales_order_items).values({
        id,
        sales_order_id: orderId,
        product_id: dto.productId ?? null,
        service_id: dto.serviceId ?? null,
        description: dto.description ?? null,
        quantity,
        quantity_delivered: '0.0000',
        unit_price: unitPrice,
        tax_id: dto.taxId ?? null,
        line_total: lineTotal,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid product, service or tax reference');
    }
    return id;
  }

  private async recalculateTotals(
    orderId: string,
    updatedBy?: string | null,
  ): Promise<void> {
    const items = await this.loadItems(orderId);
    const [order] = await this.db
      .select({ organization_id: sales_orders.organization_id })
      .from(sales_orders)
      .where(eq(sales_orders.id, orderId))
      .limit(1);

    const lines: Array<{ lineTotal: string; lineTax: string }> = [];
    for (const item of items) {
      const taxRate = await this.resolveTaxRate(
        item.tax_id,
        order!.organization_id,
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
    await this.db
      .update(sales_orders)
      .set({
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        total_amount: totals.totalAmount,
        updated_at: nowMysqlDateTime(),
        ...(updatedBy !== undefined ? { updated_by: updatedBy } : {}),
      })
      .where(eq(sales_orders.id, orderId));
  }

  private async insertStatusHistory(
    db: DrizzleDB | Tx,
    orderId: string,
    fromStatus: string | null,
    toStatus: string,
    changedBy: string | null,
    notes?: string | null,
  ): Promise<void> {
    await db.insert(sales_order_status_history).values({
      id: createId(),
      sales_order_id: orderId,
      from_status: fromStatus,
      to_status: toStatus,
      changed_by: changedBy,
      changed_at: nowMysqlDateTime(),
      notes: notes ?? null,
    });
  }

  private async resolveDefaultAddress(
    db: DrizzleDB | Tx,
    customerId: string,
    role: 'billing' | 'shipping',
  ): Promise<string | null> {
    const rows = await db
      .select({
        id: customer_addresses.id,
        type: customer_addresses.type,
        is_default: customer_addresses.is_default,
      })
      .from(customer_addresses)
      .where(
        and(
          eq(customer_addresses.customer_id, customerId),
          isNull(customer_addresses.deleted_at),
          or(
            eq(customer_addresses.type, role),
            eq(customer_addresses.type, 'both'),
          ),
        ),
      )
      .orderBy(desc(customer_addresses.is_default), asc(customer_addresses.id))
      .limit(1);
    return rows[0]?.id ?? null;
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

  private async findItem(
    orderId: string,
    itemId: string,
  ): Promise<SalesOrderItemResponseDto> {
    const row = await this.requireItem(orderId, itemId);
    return toSalesOrderItemResponse(row);
  }

  private async requireItem(
    orderId: string,
    itemId: string,
  ): Promise<SalesOrderItemRow> {
    const [row] = await this.db
      .select()
      .from(sales_order_items)
      .where(
        and(
          eq(sales_order_items.id, itemId),
          eq(sales_order_items.sales_order_id, orderId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Sales order item ${itemId} not found`);
    }
    return row as SalesOrderItemRow;
  }

  private async loadItems(orderId: string): Promise<SalesOrderItemRow[]> {
    const rows = await this.db
      .select()
      .from(sales_order_items)
      .where(eq(sales_order_items.sales_order_id, orderId))
      .orderBy(asc(sales_order_items.created_at), asc(sales_order_items.id));
    return rows as SalesOrderItemRow[];
  }

  private async requireOrderAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesOrderRow> {
    const [row] = await this.db
      .select()
      .from(sales_orders)
      .where(and(eq(sales_orders.id, id), isNull(sales_orders.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Sales order ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'sales order',
    );
    return row as SalesOrderRow;
  }

  private assertHeaderEditable(status: SalesOrderStatus): void {
    if (
      status !== SALES_ORDER_STATUS.PENDING &&
      status !== SALES_ORDER_STATUS.CONFIRMED
    ) {
      throw new BadRequestException(
        'Sales order header can only be edited while pending or confirmed',
      );
    }
  }

  private assertItemsEditable(status: SalesOrderStatus): void {
    if (status !== SALES_ORDER_STATUS.PENDING) {
      throw new BadRequestException(
        'Sales order items can only be mutated while status is pending',
      );
    }
  }

  private assertItemHasContent(
    dto: Pick<
      CreateSalesOrderItemDto,
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

  private async ensureQuotationLinkable(
    quotationId: string,
    organizationId: string,
    customerId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: quotations.id,
        organization_id: quotations.organization_id,
        customer_id: quotations.customer_id,
      })
      .from(quotations)
      .where(and(eq(quotations.id, quotationId), isNull(quotations.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Quotation ${quotationId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Quotation must belong to the same organization',
      );
    }
    if (row.customer_id !== customerId) {
      throw new BadRequestException(
        'Quotation customer must match sales order customer',
      );
    }
    const [existing] = await this.db
      .select({ id: sales_orders.id })
      .from(sales_orders)
      .where(
        and(
          eq(sales_orders.quotation_id, quotationId),
          isNull(sales_orders.deleted_at),
        ),
      )
      .limit(1);
    if (existing) {
      throw new ConflictException(
        'Quotation already linked to a sales order',
      );
    }
  }

  private async ensureAddressInCustomer(
    addressId: string | null | undefined,
    customerId: string,
    organizationId: string,
    db: DrizzleDB | Tx = this.db,
  ): Promise<void> {
    if (addressId == null) return;
    const [row] = await db
      .select({
        id: customer_addresses.id,
        customer_id: customer_addresses.customer_id,
        organization_id: customers.organization_id,
      })
      .from(customer_addresses)
      .innerJoin(customers, eq(customer_addresses.customer_id, customers.id))
      .where(
        and(
          eq(customer_addresses.id, addressId),
          isNull(customer_addresses.deleted_at),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Customer address ${addressId} not found`);
    }
    if (row.customer_id !== customerId) {
      throw new BadRequestException(
        'Address must belong to the sales order customer',
      );
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Address must belong to the same organization',
      );
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

  private buildWhere(params: {
    organizationId: string;
    search?: string;
    status?: SalesOrderStatus;
    customerId?: string;
    quotationId?: string;
    ownerUserId?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(sales_orders.organization_id, params.organizationId),
      isNull(sales_orders.deleted_at),
    ];
    if (params.search) {
      parts.push(like(sales_orders.order_number, `%${params.search}%`));
    }
    if (params.status) {
      parts.push(eq(sales_orders.status, params.status));
    }
    if (params.customerId) {
      parts.push(eq(sales_orders.customer_id, params.customerId));
    }
    if (params.quotationId) {
      parts.push(eq(sales_orders.quotation_id, params.quotationId));
    }
    if (params.ownerUserId) {
      parts.push(eq(sales_orders.owner_user_id, params.ownerUserId));
    }
    return and(...parts)!;
  }
}
