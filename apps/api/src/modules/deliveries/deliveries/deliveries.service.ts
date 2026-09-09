import {
  BadRequestException,
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
  inArray,
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
  customers,
  deliveries,
  delivery_addresses,
  delivery_items,
  inventory,
  products,
  sales_order_items,
  sales_order_status_history,
  sales_orders,
  serial_numbers,
  stock_reservations,
  warehouses,
} from '../../../database/schema';
import {
  isMysqlDuplicateError,
  throwDuplicateOrRethrow,
  throwFkOrRethrow,
} from '../../settings/utils/mysql-errors';
import {
  nowMysqlDateTime,
  toBool,
} from '../../settings/utils/mysql-datetime';
import {
  assertDeliveryQtyInvariants,
  assertSalesOrderTransition,
  SALES_ORDER_STATUS,
  type SalesOrderStatus,
} from '../../sales-orders/sales-orders/sales-order-statuses';
import { InventoryMovementsService } from '../../stock/inventory/inventory-movements.service';
import { formatDecimal } from '../../stock/inventory/inventory-quantities';
import {
  assertSerialCount,
  parseIntegerQuantity,
} from '../../stock/serials/serial-enforcement';
import { SERIAL_NUMBER_STATUS } from '../../stock/serials/serial-number-statuses';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../delivery-scope';
import {
  assertDeliveryTransition,
  DELIVERY_STATUS,
} from '../delivery-statuses';
import {
  CreateDeliveryDto,
  CreateDeliveryItemDto,
  DeliveryItemResponseDto,
  DeliveryResponseDto,
  ListDeliveriesQueryDto,
  UpdateDeliveryDto,
  UpdateDeliveryItemDto,
} from './dto/delivery.dto';
import {
  parseSerialIds,
  toDeliveryItemResponse,
  toDeliveryResponse,
  type DeliveryItemRow,
  type DeliveryRow,
} from './deliveries.mapper';

function toMysqlDateTime(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.replace('T', ' ').replace('Z', '').slice(0, 23);
}

type Tx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];

@Injectable()
export class DeliveriesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly inventoryMovementsService: InventoryMovementsService,
  ) {}

  async findAll(
    query: ListDeliveriesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<DeliveryResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      search,
      status,
      salesOrderId,
      customerId,
      warehouseId,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [
      eq(deliveries.organization_id, scopeOrgId),
      isNull(deliveries.deleted_at),
    ];
    if (search?.trim()) {
      parts.push(like(deliveries.delivery_number, `%${search.trim()}%`));
    }
    if (status) parts.push(eq(deliveries.status, status));
    if (salesOrderId) {
      parts.push(eq(deliveries.sales_order_id, salesOrderId));
    }
    if (customerId) parts.push(eq(deliveries.customer_id, customerId));
    if (warehouseId) {
      parts.push(eq(deliveries.warehouse_id, warehouseId));
    }
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(deliveries).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(deliveries)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(deliveries.created_at), asc(deliveries.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as DeliveryRow[]).map((row) => toDeliveryResponse(row)),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DeliveryResponseDto> {
    const row = await this.requireDeliveryAccess(
      id,
      currentOrganizationId,
      user,
    );
    const items = await this.loadItems(id);
    return toDeliveryResponse(row, items);
  }

  async create(
    dto: CreateDeliveryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DeliveryResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'delivery',
    );
    await ensureOrganizationExists(this.db, organizationId);

    const order = await this.requireSalesOrderInOrg(
      dto.salesOrderId,
      organizationId,
    );
    if (order.customer_id !== dto.customerId) {
      throw new BadRequestException(
        'customerId must match the sales order customer',
      );
    }
    await this.ensureCustomerInOrg(dto.customerId, organizationId);
    await this.ensureWarehouseInOrg(dto.warehouseId, organizationId);
    if (dto.deliveryAddressId) {
      await this.ensureAddressInOrg(dto.deliveryAddressId, organizationId);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(deliveries).values({
        id,
        organization_id: organizationId,
        delivery_number: dto.deliveryNumber.trim(),
        sales_order_id: dto.salesOrderId,
        customer_id: dto.customerId,
        warehouse_id: dto.warehouseId,
        delivery_address_id: dto.deliveryAddressId ?? null,
        scheduled_at: toMysqlDateTime(dto.scheduledAt),
        delivered_at: null,
        driver_user_id: dto.driverUserId ?? null,
        status: DELIVERY_STATUS.PLANNED,
        notes: dto.notes ?? null,
        created_at: now,
        updated_at: now,
        created_by: user?.id ?? null,
        updated_by: user?.id ?? null,
        deleted_at: null,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Delivery number already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid delivery reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateDeliveryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DeliveryResponseDto> {
    const existing = await this.requireDeliveryAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (existing.status !== DELIVERY_STATUS.PLANNED) {
      throw new BadRequestException(
        'Only a planned delivery can be updated',
      );
    }

    if (dto.warehouseId) {
      await this.ensureWarehouseInOrg(
        dto.warehouseId,
        existing.organization_id,
      );
    }
    if (dto.deliveryAddressId) {
      await this.ensureAddressInOrg(
        dto.deliveryAddressId,
        existing.organization_id,
      );
    }

    const patch: Partial<{
      delivery_number: string;
      warehouse_id: string;
      delivery_address_id: string | null;
      scheduled_at: string | null;
      driver_user_id: string | null;
      notes: string | null;
      updated_at: string;
      updated_by: string | null;
    }> = {
      updated_at: nowMysqlDateTime(),
      updated_by: user?.id ?? null,
    };

    if (dto.deliveryNumber !== undefined) {
      patch.delivery_number = dto.deliveryNumber.trim();
    }
    if (dto.warehouseId !== undefined) patch.warehouse_id = dto.warehouseId;
    if (dto.deliveryAddressId !== undefined) {
      patch.delivery_address_id = dto.deliveryAddressId;
    }
    if (dto.scheduledAt !== undefined) {
      patch.scheduled_at = toMysqlDateTime(dto.scheduledAt);
    }
    if (dto.driverUserId !== undefined) {
      patch.driver_user_id = dto.driverUserId;
    }
    if (dto.notes !== undefined) patch.notes = dto.notes;

    try {
      await this.db
        .update(deliveries)
        .set(patch)
        .where(eq(deliveries.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Delivery number already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid delivery reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const existing = await this.requireDeliveryAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (
      existing.status !== DELIVERY_STATUS.PLANNED &&
      existing.status !== DELIVERY_STATUS.CANCELLED
    ) {
      throw new BadRequestException(
        'Only a planned or cancelled delivery can be soft-deleted',
      );
    }
    await this.db
      .update(deliveries)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(deliveries.id, id));
  }

  async listItems(
    deliveryId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DeliveryItemResponseDto[]> {
    await this.requireDeliveryAccess(
      deliveryId,
      currentOrganizationId,
      user,
    );
    const items = await this.loadItems(deliveryId);
    return items.map(toDeliveryItemResponse);
  }

  async createItem(
    deliveryId: string,
    dto: CreateDeliveryItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DeliveryItemResponseDto> {
    const delivery = await this.requireDeliveryAccess(
      deliveryId,
      currentOrganizationId,
      user,
    );
    if (delivery.status !== DELIVERY_STATUS.PLANNED) {
      throw new BadRequestException(
        'Items can only be added to a planned delivery',
      );
    }
    if (!delivery.sales_order_id) {
      throw new BadRequestException('Delivery has no sales order');
    }

    const soItem = await this.requireSalesOrderItemOnOrder(
      dto.salesOrderItemId,
      delivery.sales_order_id,
    );
    const productId = dto.productId ?? soItem.product_id;
    if (!productId) {
      throw new BadRequestException(
        'productId is required when the sales order item has no product',
      );
    }
    if (soItem.product_id && dto.productId && dto.productId !== soItem.product_id) {
      throw new BadRequestException(
        'productId must match the sales order item product',
      );
    }

    const product = await this.requireProductInOrg(
      productId,
      delivery.organization_id,
    );
    const quantity = formatDecimal(Number(dto.quantity));
    if (!(Number(quantity) > 0)) {
      throw new BadRequestException('quantity must be greater than zero');
    }

    await this.assertRemainingQty(
      dto.salesOrderItemId,
      soItem,
      Number(quantity),
      null,
    );
    this.assertSerialPayload(
      toBool(product.is_serialized),
      quantity,
      dto.serialNumberIds,
    );

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(delivery_items).values({
        id,
        delivery_id: deliveryId,
        sales_order_item_id: dto.salesOrderItemId,
        product_id: productId,
        quantity,
        serial_number_ids: dto.serialNumberIds ?? null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid delivery item reference');
    }

    const [row] = await this.db
      .select()
      .from(delivery_items)
      .where(eq(delivery_items.id, id))
      .limit(1);
    return toDeliveryItemResponse(row as DeliveryItemRow);
  }

  async updateItem(
    deliveryId: string,
    itemId: string,
    dto: UpdateDeliveryItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DeliveryItemResponseDto> {
    const delivery = await this.requireDeliveryAccess(
      deliveryId,
      currentOrganizationId,
      user,
    );
    if (delivery.status !== DELIVERY_STATUS.PLANNED) {
      throw new BadRequestException(
        'Items can only be updated on a planned delivery',
      );
    }
    const item = await this.requireItemOnDelivery(itemId, deliveryId);
    if (!item.sales_order_item_id || !item.product_id) {
      throw new BadRequestException('Delivery item is incomplete');
    }

    const soItem = await this.requireSalesOrderItemOnOrder(
      item.sales_order_item_id,
      delivery.sales_order_id!,
    );
    const product = await this.requireProductInOrg(
      item.product_id,
      delivery.organization_id,
    );

    const nextQty =
      dto.quantity !== undefined
        ? formatDecimal(Number(dto.quantity))
        : item.quantity;
    if (!(Number(nextQty) > 0)) {
      throw new BadRequestException('quantity must be greater than zero');
    }

    await this.assertRemainingQty(
      item.sales_order_item_id,
      soItem,
      Number(nextQty),
      itemId,
    );

    const nextSerials =
      dto.serialNumberIds !== undefined
        ? dto.serialNumberIds
        : (toDeliveryItemResponse(item).serialNumberIds ?? undefined);
    this.assertSerialPayload(
      toBool(product.is_serialized),
      nextQty,
      nextSerials ?? undefined,
    );

    const patch: {
      quantity: string;
      serial_number_ids?: string[] | null;
      updated_at: string;
    } = {
      quantity: nextQty,
      updated_at: nowMysqlDateTime(),
    };
    if (dto.serialNumberIds !== undefined) {
      patch.serial_number_ids = dto.serialNumberIds;
    }

    await this.db
      .update(delivery_items)
      .set(patch)
      .where(eq(delivery_items.id, itemId));

    const [row] = await this.db
      .select()
      .from(delivery_items)
      .where(eq(delivery_items.id, itemId))
      .limit(1);
    return toDeliveryItemResponse(row as DeliveryItemRow);
  }

  async removeItem(
    deliveryId: string,
    itemId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const delivery = await this.requireDeliveryAccess(
      deliveryId,
      currentOrganizationId,
      user,
    );
    if (delivery.status !== DELIVERY_STATUS.PLANNED) {
      throw new BadRequestException(
        'Items can only be removed from a planned delivery',
      );
    }
    await this.requireItemOnDelivery(itemId, deliveryId);
    await this.db
      .delete(delivery_items)
      .where(eq(delivery_items.id, itemId));
  }

  async start(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DeliveryResponseDto> {
    const delivery = await this.requireDeliveryAccess(
      id,
      currentOrganizationId,
      user,
    );
    try {
      assertDeliveryTransition(delivery.status, DELIVERY_STATUS.IN_TRANSIT);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }
    const items = await this.loadItems(id);
    if (items.length === 0) {
      throw new BadRequestException(
        'Cannot start a delivery without line items',
      );
    }

    await this.db
      .update(deliveries)
      .set({
        status: DELIVERY_STATUS.IN_TRANSIT,
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(deliveries.id, id));

    return this.findOne(id, currentOrganizationId, user);
  }

  async complete(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DeliveryResponseDto> {
    const delivery = await this.requireDeliveryAccess(
      id,
      currentOrganizationId,
      user,
    );
    try {
      assertDeliveryTransition(delivery.status, DELIVERY_STATUS.DELIVERED);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }
    if (!delivery.warehouse_id) {
      throw new BadRequestException(
        'Delivery warehouseId is required to complete',
      );
    }
    if (!delivery.sales_order_id) {
      throw new BadRequestException('Delivery has no sales order');
    }

    const items = await this.loadItems(id);
    if (items.length === 0) {
      throw new BadRequestException(
        'Cannot complete a delivery without line items',
      );
    }

    const [order] = await this.db
      .select()
      .from(sales_orders)
      .where(eq(sales_orders.id, delivery.sales_order_id))
      .limit(1);
    if (!order || order.deleted_at != null) {
      throw new NotFoundException(
        `Sales order ${delivery.sales_order_id} not found`,
      );
    }
    const soStatus = order.status as SalesOrderStatus;
    if (
      soStatus !== SALES_ORDER_STATUS.IN_PROGRESS &&
      soStatus !== SALES_ORDER_STATUS.PARTIALLY_DELIVERED
    ) {
      throw new BadRequestException(
        `Sales order must be in_progress or partially_delivered to complete a delivery (is "${soStatus}")`,
      );
    }

    const warehouseId = delivery.warehouse_id;
    const now = nowMysqlDateTime();

    await this.db.transaction(async (tx) => {
      for (const item of items) {
        if (!item.product_id || !item.sales_order_item_id) {
          throw new BadRequestException(
            `Delivery item ${item.id} is missing product or sales order item`,
          );
        }
        const serialIds = parseSerialIds(item.serial_number_ids) ?? undefined;
        await this.issueStockOut(tx, {
          organizationId: delivery.organization_id,
          warehouseId,
          productId: item.product_id,
          quantity: item.quantity,
          deliveryId: id,
          salesOrderItemId: item.sales_order_item_id,
          serialIds,
          movedBy: user?.id ?? null,
          now,
        });

        const [soItem] = await tx
          .select({
            id: sales_order_items.id,
            quantity: sales_order_items.quantity,
            quantity_delivered: sales_order_items.quantity_delivered,
          })
          .from(sales_order_items)
          .where(eq(sales_order_items.id, item.sales_order_item_id))
          .limit(1);
        if (!soItem) {
          throw new NotFoundException(
            `Sales order item ${item.sales_order_item_id} not found`,
          );
        }
        const nextDelivered = formatDecimal(
          Number(soItem.quantity_delivered) + Number(item.quantity),
        );
        if (Number(nextDelivered) > Number(soItem.quantity) + 1e-12) {
          throw new BadRequestException(
            'quantity_delivered cannot exceed quantity',
          );
        }
        await tx
          .update(sales_order_items)
          .set({
            quantity_delivered: nextDelivered,
            updated_at: now,
          })
          .where(eq(sales_order_items.id, item.sales_order_item_id));
      }

      await tx
        .update(deliveries)
        .set({
          status: DELIVERY_STATUS.DELIVERED,
          delivered_at: now,
          updated_at: now,
          updated_by: user?.id ?? null,
        })
        .where(eq(deliveries.id, id));

      await this.syncSalesOrderStatus(
        tx,
        delivery.sales_order_id!,
        soStatus,
        user?.id ?? null,
        now,
      );
    });

    return this.findOne(id, currentOrganizationId, user);
  }

  async fail(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DeliveryResponseDto> {
    return this.terminalTransition(
      id,
      DELIVERY_STATUS.FAILED,
      currentOrganizationId,
      user,
    );
  }

  async cancel(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DeliveryResponseDto> {
    return this.terminalTransition(
      id,
      DELIVERY_STATUS.CANCELLED,
      currentOrganizationId,
      user,
    );
  }

  private async terminalTransition(
    id: string,
    toStatus: typeof DELIVERY_STATUS.FAILED | typeof DELIVERY_STATUS.CANCELLED,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DeliveryResponseDto> {
    const delivery = await this.requireDeliveryAccess(
      id,
      currentOrganizationId,
      user,
    );
    try {
      assertDeliveryTransition(delivery.status, toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }
    await this.db
      .update(deliveries)
      .set({
        status: toStatus,
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(deliveries.id, id));
    return this.findOne(id, currentOrganizationId, user);
  }

  private async issueStockOut(
    tx: Tx,
    params: {
      organizationId: string;
      warehouseId: string;
      productId: string;
      quantity: string;
      deliveryId: string;
      salesOrderItemId: string;
      serialIds?: string[];
      movedBy: string | null;
      now: string;
    },
  ): Promise<void> {
    const serialIds = params.serialIds;
    let locationId: string | null = null;
    let batchId: string | null = null;

    if (serialIds?.length) {
      const rows = await tx
        .select({
          id: serial_numbers.id,
          status: serial_numbers.status,
        })
        .from(serial_numbers)
        .where(inArray(serial_numbers.id, serialIds));
      if (rows.length !== serialIds.length) {
        throw new BadRequestException(
          'One or more serialNumberIds were not found',
        );
      }
      const reserved = rows.filter(
        (r) => r.status === SERIAL_NUMBER_STATUS.RESERVED,
      );
      const inStock = rows.filter(
        (r) => r.status === SERIAL_NUMBER_STATUS.IN_STOCK,
      );
      if (reserved.length + inStock.length !== rows.length) {
        throw new BadRequestException(
          'Delivery serials must be in_stock or reserved',
        );
      }
      if (reserved.length > 0) {
        await this.inventoryMovementsService.applyMovement(
          {
            organizationId: params.organizationId,
            productId: params.productId,
            warehouseId: params.warehouseId,
            movementType: 'unreserve',
            quantity: formatDecimal(reserved.length),
            referenceType: 'delivery',
            referenceId: params.deliveryId,
            movedBy: params.movedBy,
            notes: 'Delivery complete — unreserve',
            serialIds: reserved.map((r) => r.id),
            salesOrderItemId: params.salesOrderItemId,
          },
          tx,
        );
      }
    } else {
      const [reservation] = await tx
        .select()
        .from(stock_reservations)
        .where(
          and(
            eq(
              stock_reservations.sales_order_item_id,
              params.salesOrderItemId,
            ),
            eq(stock_reservations.status, 'active'),
          ),
        )
        .limit(1);
      if (
        reservation &&
        Math.abs(Number(reservation.quantity) - Number(params.quantity)) <
          1e-12
      ) {
        const [inv] = await tx
          .select({
            warehouse_id: inventory.warehouse_id,
            location_id: inventory.location_id,
            batch_id: inventory.batch_id,
          })
          .from(inventory)
          .where(eq(inventory.id, reservation.inventory_id))
          .limit(1);
        if (inv) {
          locationId = inv.location_id;
          batchId = inv.batch_id;
        }
        await this.inventoryMovementsService.applyMovement(
          {
            organizationId: params.organizationId,
            productId: params.productId,
            warehouseId: inv?.warehouse_id ?? params.warehouseId,
            locationId,
            batchId,
            movementType: 'unreserve',
            quantity: params.quantity,
            referenceType: 'delivery',
            referenceId: params.deliveryId,
            movedBy: params.movedBy,
            notes: 'Delivery complete — unreserve reservation',
            salesOrderItemId: params.salesOrderItemId,
          },
          tx,
        );
        await tx
          .update(stock_reservations)
          .set({
            status: 'fulfilled',
            updated_at: params.now,
          })
          .where(eq(stock_reservations.id, reservation.id));
      }
    }

    await this.inventoryMovementsService.applyMovement(
      {
        organizationId: params.organizationId,
        productId: params.productId,
        warehouseId: params.warehouseId,
        locationId,
        batchId,
        movementType: 'out',
        quantity: params.quantity,
        referenceType: 'delivery',
        referenceId: params.deliveryId,
        movedAt: params.now,
        movedBy: params.movedBy,
        notes: 'Delivery complete',
        serialIds,
        salesOrderItemId: params.salesOrderItemId,
      },
      tx,
    );

    if (serialIds?.length) {
      await tx
        .update(stock_reservations)
        .set({ status: 'fulfilled', updated_at: params.now })
        .where(
          and(
            eq(stock_reservations.sales_order_item_id, params.salesOrderItemId),
            eq(stock_reservations.status, 'active'),
            eq(stock_reservations.quantity, params.quantity),
          ),
        );
    }
  }

  private async syncSalesOrderStatus(
    tx: Tx,
    salesOrderId: string,
    currentStatus: SalesOrderStatus,
    changedBy: string | null,
    now: string,
  ): Promise<void> {
    const lines = await tx
      .select({
        quantity: sales_order_items.quantity,
        quantity_delivered: sales_order_items.quantity_delivered,
      })
      .from(sales_order_items)
      .where(eq(sales_order_items.sales_order_id, salesOrderId));

    const qtyLines = lines.map((line) => ({
      quantity: line.quantity,
      quantityDelivered: line.quantity_delivered,
    }));

    const allComplete =
      qtyLines.length > 0 &&
      qtyLines.every(
        (line) => Number(line.quantityDelivered) >= Number(line.quantity),
      );
    const anyProgress = qtyLines.some(
      (line) => Number(line.quantityDelivered) > 0,
    );

    let nextStatus: SalesOrderStatus | null = null;
    if (allComplete) {
      nextStatus = SALES_ORDER_STATUS.DELIVERED;
    } else if (anyProgress) {
      nextStatus = SALES_ORDER_STATUS.PARTIALLY_DELIVERED;
    }

    if (!nextStatus || nextStatus === currentStatus) {
      return;
    }

    try {
      assertSalesOrderTransition(currentStatus, nextStatus);
      assertDeliveryQtyInvariants(nextStatus, qtyLines);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid sales order status',
      );
    }

    await tx
      .update(sales_orders)
      .set({
        status: nextStatus,
        updated_at: now,
        updated_by: changedBy,
      })
      .where(eq(sales_orders.id, salesOrderId));

    await tx.insert(sales_order_status_history).values({
      id: createId(),
      sales_order_id: salesOrderId,
      from_status: currentStatus,
      to_status: nextStatus,
      changed_by: changedBy,
      changed_at: now,
      notes: 'Updated by delivery complete',
    });
  }

  private assertSerialPayload(
    isSerialized: boolean,
    quantity: string,
    serialIds: string[] | undefined,
  ): void {
    if (!isSerialized) {
      if (serialIds?.length) {
        throw new BadRequestException(
          'Product is not serialized; omit serialNumberIds',
        );
      }
      return;
    }
    try {
      const qty = parseIntegerQuantity(quantity);
      if (qty <= 0) {
        throw new Error('Serialized quantity must be positive');
      }
      assertSerialCount(qty, serialIds, 'serialNumberIds');
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid serial payload',
      );
    }
  }

  private async assertRemainingQty(
    salesOrderItemId: string,
    soItem: { quantity: string; quantity_delivered: string },
    requestedQty: number,
    excludeDeliveryItemId: string | null,
  ): Promise<void> {
    const ordered = Number(soItem.quantity);
    const alreadyDelivered = Number(soItem.quantity_delivered);
    const openRows = await this.db
      .select({
        id: delivery_items.id,
        quantity: delivery_items.quantity,
        status: deliveries.status,
      })
      .from(delivery_items)
      .innerJoin(deliveries, eq(delivery_items.delivery_id, deliveries.id))
      .where(
        and(
          eq(delivery_items.sales_order_item_id, salesOrderItemId),
          isNull(deliveries.deleted_at),
          inArray(deliveries.status, [
            DELIVERY_STATUS.PLANNED,
            DELIVERY_STATUS.IN_TRANSIT,
          ]),
        ),
      );

    let allocated = 0;
    for (const row of openRows) {
      if (excludeDeliveryItemId && row.id === excludeDeliveryItemId) {
        continue;
      }
      allocated += Number(row.quantity);
    }

    const remaining = ordered - alreadyDelivered - allocated;
    if (requestedQty > remaining + 1e-12) {
      throw new BadRequestException(
        `quantity exceeds remaining to deliver (have ${formatDecimal(remaining)}, need ${formatDecimal(requestedQty)})`,
      );
    }
  }

  private async loadItems(deliveryId: string): Promise<DeliveryItemRow[]> {
    const rows = await this.db
      .select()
      .from(delivery_items)
      .where(eq(delivery_items.delivery_id, deliveryId))
      .orderBy(asc(delivery_items.created_at), asc(delivery_items.id));
    return rows as DeliveryItemRow[];
  }

  private async requireDeliveryAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DeliveryRow> {
    const [row] = await this.db
      .select()
      .from(deliveries)
      .where(and(eq(deliveries.id, id), isNull(deliveries.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Delivery ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'delivery',
    );
    return row as DeliveryRow;
  }

  private async requireItemOnDelivery(
    itemId: string,
    deliveryId: string,
  ): Promise<DeliveryItemRow> {
    const [row] = await this.db
      .select()
      .from(delivery_items)
      .where(
        and(
          eq(delivery_items.id, itemId),
          eq(delivery_items.delivery_id, deliveryId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Delivery item ${itemId} not found`);
    }
    return row as DeliveryItemRow;
  }

  private async requireSalesOrderInOrg(
    salesOrderId: string,
    organizationId: string,
  ): Promise<{ id: string; customer_id: string; status: string }> {
    const [row] = await this.db
      .select({
        id: sales_orders.id,
        customer_id: sales_orders.customer_id,
        organization_id: sales_orders.organization_id,
        status: sales_orders.status,
        deleted_at: sales_orders.deleted_at,
      })
      .from(sales_orders)
      .where(eq(sales_orders.id, salesOrderId))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Sales order ${salesOrderId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Sales order must belong to the same organization',
      );
    }
    if (row.status === 'cancelled' || row.status === 'delivered') {
      throw new BadRequestException(
        `Cannot create a delivery for a sales order in status "${row.status}"`,
      );
    }
    return {
      id: row.id,
      customer_id: row.customer_id,
      status: row.status,
    };
  }

  private async requireSalesOrderItemOnOrder(
    salesOrderItemId: string,
    salesOrderId: string,
  ): Promise<{
    id: string;
    product_id: string | null;
    quantity: string;
    quantity_delivered: string;
  }> {
    const [row] = await this.db
      .select({
        id: sales_order_items.id,
        sales_order_id: sales_order_items.sales_order_id,
        product_id: sales_order_items.product_id,
        quantity: sales_order_items.quantity,
        quantity_delivered: sales_order_items.quantity_delivered,
      })
      .from(sales_order_items)
      .where(eq(sales_order_items.id, salesOrderItemId))
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Sales order item ${salesOrderItemId} not found`,
      );
    }
    if (row.sales_order_id !== salesOrderId) {
      throw new BadRequestException(
        'salesOrderItemId must belong to the delivery sales order',
      );
    }
    return row;
  }

  private async requireProductInOrg(
    productId: string,
    organizationId: string,
  ): Promise<{ id: string; is_serialized: number }> {
    const [row] = await this.db
      .select({
        id: products.id,
        organization_id: products.organization_id,
        deleted_at: products.deleted_at,
        is_serialized: products.is_serialized,
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Product must belong to the same organization',
      );
    }
    return { id: row.id, is_serialized: row.is_serialized };
  }

  private async ensureCustomerInOrg(
    customerId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: customers.id,
        organization_id: customers.organization_id,
        deleted_at: customers.deleted_at,
      })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Customer must belong to the same organization',
      );
    }
  }

  private async ensureWarehouseInOrg(
    warehouseId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: warehouses.id,
        organization_id: warehouses.organization_id,
        deleted_at: warehouses.deleted_at,
      })
      .from(warehouses)
      .where(eq(warehouses.id, warehouseId))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Warehouse ${warehouseId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Warehouse must belong to the same organization',
      );
    }
  }

  private async ensureAddressInOrg(
    addressId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: delivery_addresses.id,
        organization_id: delivery_addresses.organization_id,
        deleted_at: delivery_addresses.deleted_at,
      })
      .from(delivery_addresses)
      .where(eq(delivery_addresses.id, addressId))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Delivery address ${addressId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Delivery address must belong to the same organization',
      );
    }
  }
}
