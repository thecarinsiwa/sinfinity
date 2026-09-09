import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, isNull, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  inventory,
  products,
  stock_adjustments,
  warehouses,
} from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { InventoryMovementsService } from '../inventory/inventory-movements.service';
import { formatDecimal } from '../inventory/inventory-quantities';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../stock-scope';
import {
  type AdjustmentReason,
  CreateStockAdjustmentDto,
  ListStockAdjustmentsQueryDto,
  StockAdjustmentResponseDto,
} from './dto/stock-adjustment.dto';

export type StockAdjustmentRow = {
  id: string;
  organization_id: string;
  warehouse_id: string;
  product_id: string;
  quantity_before: string;
  quantity_after: string;
  reason: AdjustmentReason;
  adjusted_by: string | null;
  adjusted_at: string;
  notes: string | null;
  created_at: string;
};

function toResponse(row: StockAdjustmentRow): StockAdjustmentResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    warehouseId: row.warehouse_id,
    productId: row.product_id,
    quantityBefore: row.quantity_before,
    quantityAfter: row.quantity_after,
    reason: row.reason,
    adjustedBy: row.adjusted_by,
    adjustedAt: row.adjusted_at,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

@Injectable()
export class StockAdjustmentsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly inventoryMovementsService: InventoryMovementsService,
  ) {}

  async findAll(
    query: ListStockAdjustmentsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<StockAdjustmentResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      warehouseId,
      productId,
      reason,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [
      eq(stock_adjustments.organization_id, scopeOrgId),
    ];
    if (warehouseId) {
      parts.push(eq(stock_adjustments.warehouse_id, warehouseId));
    }
    if (productId) {
      parts.push(eq(stock_adjustments.product_id, productId));
    }
    if (reason) parts.push(eq(stock_adjustments.reason, reason));
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(stock_adjustments).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(stock_adjustments)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(
          desc(stock_adjustments.adjusted_at),
          asc(stock_adjustments.id),
        )
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as StockAdjustmentRow[]).map(toResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<StockAdjustmentResponseDto> {
    const [row] = await this.db
      .select()
      .from(stock_adjustments)
      .where(eq(stock_adjustments.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Stock adjustment ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'stock adjustment',
    );
    return toResponse(row as StockAdjustmentRow);
  }

  async create(
    dto: CreateStockAdjustmentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<StockAdjustmentResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'stock adjustment',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureWarehouseInOrg(dto.warehouseId, organizationId);
    await this.ensureProductInOrg(dto.productId, organizationId);

    const locationId = dto.locationId ?? null;
    const batchId = dto.batchId ?? null;
    const quantityAfter = formatDecimal(Number(dto.quantityAfter));
    if (Number(quantityAfter) < 0) {
      throw new BadRequestException('quantityAfter cannot be negative');
    }

    const beforeRow = await this.findInventoryQty(
      dto.warehouseId,
      locationId,
      dto.productId,
      batchId,
    );
    const quantityBefore = beforeRow?.quantity_on_hand ?? '0.0000';
    const delta = formatDecimal(Number(quantityAfter) - Number(quantityBefore));
    if (Number(delta) === 0) {
      throw new BadRequestException(
        'quantityAfter equals current on_hand; nothing to adjust',
      );
    }

    const id = createId();
    const now = nowMysqlDateTime();

    await this.db.transaction(async (tx) => {
      await this.inventoryMovementsService.applyMovement(
        {
          organizationId,
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          locationId,
          batchId,
          movementType: 'adjustment',
          quantity: delta,
          referenceType: 'stock_adjustment',
          referenceId: id,
          movedAt: now,
          movedBy: user?.id ?? null,
          notes: dto.notes ?? `Adjustment reason: ${dto.reason}`,
          serialNumbers: dto.serialNumbers,
          serialIds: dto.serialIds,
        },
        tx,
      );

      try {
        await tx.insert(stock_adjustments).values({
          id,
          organization_id: organizationId,
          warehouse_id: dto.warehouseId,
          product_id: dto.productId,
          quantity_before: quantityBefore,
          quantity_after: quantityAfter,
          reason: dto.reason,
          adjusted_by: user?.id ?? null,
          adjusted_at: now,
          notes: dto.notes ?? null,
          created_at: now,
        });
      } catch (error) {
        throwFkOrRethrow(error, 'Invalid warehouse or product reference');
      }
    });

    return this.findOne(id, currentOrganizationId, user);
  }

  private async findInventoryQty(
    warehouseId: string,
    locationId: string | null,
    productId: string,
    batchId: string | null,
  ): Promise<{ quantity_on_hand: string } | null> {
    const parts: SQL[] = [
      eq(inventory.warehouse_id, warehouseId),
      eq(inventory.product_id, productId),
      locationId == null
        ? isNull(inventory.location_id)
        : eq(inventory.location_id, locationId),
      batchId == null
        ? isNull(inventory.batch_id)
        : eq(inventory.batch_id, batchId),
    ];
    const [row] = await this.db
      .select({ quantity_on_hand: inventory.quantity_on_hand })
      .from(inventory)
      .where(and(...parts)!)
      .limit(1);
    return row ?? null;
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

  private async ensureProductInOrg(
    productId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: products.id,
        organization_id: products.organization_id,
        deleted_at: products.deleted_at,
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
  }
}
