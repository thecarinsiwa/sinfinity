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
  purchase_order_items,
  purchase_order_status_history,
  purchase_orders,
  purchase_receipts,
} from '../../../database/schema';
import {
  isMysqlDuplicateError,
  throwDuplicateOrRethrow,
  throwFkOrRethrow,
} from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../purchase-orders-scope';
import { formatDecimal } from '../purchase-orders-totals';
import { PURCHASE_ORDER_STATUS } from '../purchase-orders/purchase-order-statuses';
import type { PurchaseOrderRow } from '../purchase-orders/purchase-orders.mapper';
import { INVENTORY_PORT, type InventoryPort } from '../inventory/inventory.port';
import {
  ConfirmPurchaseReceiptDto,
  type PurchaseReceiptStatus,
  CreatePurchaseReceiptDto,
  PurchaseReceiptResponseDto,
  UpdatePurchaseReceiptDto,
} from './dto/purchase-receipt.dto';
import { ListPurchaseReceiptsQueryDto } from './dto/list-purchase-receipts-query.dto';
import {
  toPurchaseReceiptResponse,
  type PurchaseReceiptRow,
} from './purchase-receipts.mapper';

type Tx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];

function toMysqlDateTime(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.replace('T', ' ').replace('Z', '');
}

@Injectable()
export class PurchaseReceiptsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Inject(INVENTORY_PORT) private readonly inventoryPort: InventoryPort,
  ) {}

  async findAll(
    query: ListPurchaseReceiptsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<PurchaseReceiptResponseDto>> {
    const { page, pageSize, organizationId, search, status, purchaseOrderId } =
      query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      search,
      status,
      purchaseOrderId,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(purchase_receipts).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(purchase_receipts)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(purchase_receipts.created_at), asc(purchase_receipts.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as PurchaseReceiptRow[]).map(toPurchaseReceiptResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PurchaseReceiptResponseDto> {
    const row = await this.requireReceiptAccess(id, currentOrganizationId, user);
    return toPurchaseReceiptResponse(row);
  }

  async create(
    dto: CreatePurchaseReceiptDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PurchaseReceiptResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'purchase receipt',
    );
    await ensureOrganizationExists(this.db, organizationId);

    const [order] = await this.db
      .select({
        id: purchase_orders.id,
        organization_id: purchase_orders.organization_id,
        deleted_at: purchase_orders.deleted_at,
      })
      .from(purchase_orders)
      .where(eq(purchase_orders.id, dto.purchaseOrderId))
      .limit(1);

    if (!order || order.deleted_at != null) {
      throw new NotFoundException(
        `Purchase order ${dto.purchaseOrderId} not found`,
      );
    }
    if (order.organization_id !== organizationId) {
      throw new BadRequestException(
        'Purchase order must belong to the same organization',
      );
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(purchase_receipts).values({
        id,
        organization_id: organizationId,
        purchase_order_id: dto.purchaseOrderId,
        receipt_number: dto.receiptNumber.trim(),
        warehouse_id: dto.warehouseId ?? null,
        received_at: toMysqlDateTime(dto.receivedAt),
        received_by: null,
        shipment_id: dto.shipmentId ?? null,
        notes: dto.notes ?? null,
        status: 'draft',
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Receipt number already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid purchase order, warehouse or shipment');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdatePurchaseReceiptDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PurchaseReceiptResponseDto> {
    const receipt = await this.requireReceiptAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (receipt.status !== 'draft') {
      throw new BadRequestException(
        'Only a draft purchase receipt can be updated',
      );
    }

    const patch: Partial<{
      receipt_number: string;
      warehouse_id: string | null;
      received_at: string | null;
      shipment_id: string | null;
      notes: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.receiptNumber !== undefined)
      patch.receipt_number = dto.receiptNumber.trim();
    if (dto.warehouseId !== undefined) patch.warehouse_id = dto.warehouseId;
    if (dto.receivedAt !== undefined)
      patch.received_at = toMysqlDateTime(dto.receivedAt);
    if (dto.shipmentId !== undefined) patch.shipment_id = dto.shipmentId;
    if (dto.notes !== undefined) patch.notes = dto.notes;

    try {
      await this.db
        .update(purchase_receipts)
        .set(patch)
        .where(eq(purchase_receipts.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throw new ConflictException(
          'Receipt number already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid warehouse or shipment reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const receipt = await this.requireReceiptAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (receipt.status !== 'draft') {
      throw new BadRequestException(
        'Only a draft purchase receipt can be deleted',
      );
    }
    await this.db.delete(purchase_receipts).where(eq(purchase_receipts.id, id));
  }

  async confirm(
    id: string,
    dto: ConfirmPurchaseReceiptDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PurchaseReceiptResponseDto> {
    const updatedId = await this.db.transaction(async (tx) => {
      const [receipt] = await tx
        .select()
        .from(purchase_receipts)
        .where(eq(purchase_receipts.id, id))
        .limit(1);
      if (!receipt) {
        throw new NotFoundException(`Purchase receipt ${id} not found`);
      }
      assertOrgAccess(
        (receipt as PurchaseReceiptRow).organization_id,
        currentOrganizationId,
        user,
        'purchase receipt',
      );
      if ((receipt as PurchaseReceiptRow).status !== 'draft') {
        throw new BadRequestException(
          'Only a draft purchase receipt can be confirmed',
        );
      }

      const [order] = await tx
        .select()
        .from(purchase_orders)
        .where(eq(purchase_orders.id, (receipt as PurchaseReceiptRow).purchase_order_id))
        .limit(1);
      if (!order || (order as PurchaseOrderRow).deleted_at != null) {
        throw new NotFoundException(
          `Purchase order ${(receipt as PurchaseReceiptRow).purchase_order_id} not found`,
        );
      }
      if (
        (order as PurchaseOrderRow).status === PURCHASE_ORDER_STATUS.CANCELLED ||
        (order as PurchaseOrderRow).status === PURCHASE_ORDER_STATUS.CLOSED
      ) {
        throw new BadRequestException(
          'Cannot confirm a receipt for a cancelled or closed purchase order',
        );
      }

      const now = nowMysqlDateTime();
      let anyIncrement = false;
      const inventoryLines: Array<{
        purchaseOrderItemId: string;
        productId: string | null;
        quantity: string;
      }> = [];

      for (const line of dto.lines) {
        const inc = Number(line.quantity);
        if (!Number.isFinite(inc) || inc <= 0) {
          throw new BadRequestException('quantity must be > 0');
        }
        const [item] = await tx
          .select()
          .from(purchase_order_items)
          .where(eq(purchase_order_items.id, line.purchaseOrderItemId))
          .limit(1);
        if (!item) {
          throw new NotFoundException(
            `Purchase order item ${line.purchaseOrderItemId} not found`,
          );
        }
        if (
          (item as any).purchase_order_id !==
          (receipt as PurchaseReceiptRow).purchase_order_id
        ) {
          throw new BadRequestException(
            'purchaseOrderItemId must belong to the same purchase order as the receipt',
          );
        }

        const quantity = Number((item as any).quantity);
        const received = Number((item as any).quantity_received);
        const next = received + inc;
        if (next > quantity) {
          throw new BadRequestException(
            'quantityReceived cannot exceed quantity',
          );
        }

        await tx
          .update(purchase_order_items)
          .set({
            quantity_received: formatDecimal(next),
            updated_at: now,
          })
          .where(eq(purchase_order_items.id, line.purchaseOrderItemId));

        anyIncrement = true;
        inventoryLines.push({
          purchaseOrderItemId: line.purchaseOrderItemId,
          productId: (item as any).product_id ?? null,
          quantity: formatDecimal(inc),
        });
      }

      if (!anyIncrement) {
        throw new BadRequestException('Confirm requires at least one line');
      }

      const items = await tx
        .select()
        .from(purchase_order_items)
        .where(eq(purchase_order_items.purchase_order_id, (receipt as PurchaseReceiptRow).purchase_order_id))
        .orderBy(asc(purchase_order_items.created_at), asc(purchase_order_items.id));

      const hasAnyReceived = (items as any[]).some(
        (i) => Number(i.quantity_received) > 0,
      );
      const allComplete =
        (items as any[]).length > 0 &&
        (items as any[]).every(
          (i) => Number(i.quantity_received) >= Number(i.quantity),
        );
      const nextStatus = allComplete
        ? PURCHASE_ORDER_STATUS.RECEIVED
        : hasAnyReceived
          ? PURCHASE_ORDER_STATUS.PARTIAL
          : (order as PurchaseOrderRow).status;

      if (
        nextStatus === PURCHASE_ORDER_STATUS.PARTIAL ||
        nextStatus === PURCHASE_ORDER_STATUS.RECEIVED
      ) {
        if ((order as PurchaseOrderRow).status !== nextStatus) {
          await tx
            .update(purchase_orders)
            .set({
              status: nextStatus,
              updated_at: now,
              updated_by: user?.id ?? null,
            })
            .where(eq(purchase_orders.id, (order as PurchaseOrderRow).id));

          await tx.insert(purchase_order_status_history).values({
            id: createId(),
            purchase_order_id: (order as PurchaseOrderRow).id,
            from_status: (order as PurchaseOrderRow).status,
            to_status: nextStatus,
            changed_by: user?.id ?? null,
            changed_at: now,
            notes: null,
          });
        }
      }

      await tx
        .update(purchase_receipts)
        .set({
          status: 'confirmed',
          received_at: (receipt as PurchaseReceiptRow).received_at ?? now,
          received_by: user?.id ?? null,
          updated_at: now,
        })
        .where(eq(purchase_receipts.id, id));

      // Port side-effect: inventory movements via StockInventoryPortAdapter
      await this.inventoryPort.recordInbound({
        organizationId: (receipt as PurchaseReceiptRow).organization_id,
        warehouseId: (receipt as PurchaseReceiptRow).warehouse_id ?? null,
        purchaseReceiptId: id,
        movedAt: (receipt as PurchaseReceiptRow).received_at ?? now,
        movedBy: user?.id ?? null,
        lines: inventoryLines,
      });

      return id;
    });

    return this.findOne(updatedId, currentOrganizationId, user);
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
    status?: PurchaseReceiptStatus;
    purchaseOrderId?: string;
  }): SQL {
    const parts: SQL[] = [eq(purchase_receipts.organization_id, params.organizationId)];
    if (params.search?.trim()) {
      const term = `%${params.search.trim()}%`;
      parts.push(like(purchase_receipts.receipt_number, term));
    }
    if (params.status) {
      parts.push(eq(purchase_receipts.status, params.status));
    }
    if (params.purchaseOrderId) {
      parts.push(eq(purchase_receipts.purchase_order_id, params.purchaseOrderId));
    }
    return and(...parts)!;
  }

  private async requireReceiptAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PurchaseReceiptRow> {
    const [row] = await this.db
      .select()
      .from(purchase_receipts)
      .where(eq(purchase_receipts.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Purchase receipt ${id} not found`);
    }
    assertOrgAccess(
      (row as PurchaseReceiptRow).organization_id,
      currentOrganizationId,
      user,
      'purchase receipt',
    );
    return row as PurchaseReceiptRow;
  }
}

