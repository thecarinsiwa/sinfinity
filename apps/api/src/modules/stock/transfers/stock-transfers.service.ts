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
  inventory_movements,
  stock_transfers,
  warehouses,
} from '../../../database/schema';
import {
  isMysqlDuplicateError,
  throwDuplicateOrRethrow,
  throwFkOrRethrow,
} from '../../settings/utils/mysql-errors';
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
  CreateStockTransferDto,
  ListStockTransfersQueryDto,
  StockTransferLineDto,
  StockTransferResponseDto,
  TransitionStockTransferDto,
  UpdateStockTransferDto,
} from './dto/stock-transfer.dto';
import {
  assertStockTransferTransition,
  STOCK_TRANSFER_STATUS,
  type StockTransferStatus,
} from './stock-transfer-statuses';

export type StockTransferRow = {
  id: string;
  organization_id: string;
  transfer_number: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  status: StockTransferStatus;
  transferred_at: string | null;
  requested_by: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
};

type Tx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];

function toTransferResponse(row: StockTransferRow): StockTransferResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    transferNumber: row.transfer_number,
    fromWarehouseId: row.from_warehouse_id,
    toWarehouseId: row.to_warehouse_id,
    status: row.status,
    transferredAt: row.transferred_at,
    requestedBy: row.requested_by,
    approvedBy: row.approved_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class StockTransfersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly inventoryMovementsService: InventoryMovementsService,
  ) {}

  async findAll(
    query: ListStockTransfersQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<StockTransferResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      search,
      status,
      fromWarehouseId,
      toWarehouseId,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [
      eq(stock_transfers.organization_id, scopeOrgId),
    ];
    if (search?.trim()) {
      parts.push(
        like(stock_transfers.transfer_number, `%${search.trim()}%`),
      );
    }
    if (status) parts.push(eq(stock_transfers.status, status));
    if (fromWarehouseId) {
      parts.push(eq(stock_transfers.from_warehouse_id, fromWarehouseId));
    }
    if (toWarehouseId) {
      parts.push(eq(stock_transfers.to_warehouse_id, toWarehouseId));
    }
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(stock_transfers).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(stock_transfers)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(stock_transfers.created_at), asc(stock_transfers.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as StockTransferRow[]).map(toTransferResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<StockTransferResponseDto> {
    return toTransferResponse(
      await this.requireAccess(id, currentOrganizationId, user),
    );
  }

  async create(
    dto: CreateStockTransferDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<StockTransferResponseDto> {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException(
        'fromWarehouseId and toWarehouseId must differ',
      );
    }
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'stock transfer',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureWarehouseInOrg(dto.fromWarehouseId, organizationId);
    await this.ensureWarehouseInOrg(dto.toWarehouseId, organizationId);

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(stock_transfers).values({
        id,
        organization_id: organizationId,
        transfer_number: dto.transferNumber.trim(),
        from_warehouse_id: dto.fromWarehouseId,
        to_warehouse_id: dto.toWarehouseId,
        status: STOCK_TRANSFER_STATUS.DRAFT,
        transferred_at: null,
        requested_by: dto.requestedBy ?? user?.id ?? null,
        approved_by: null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Transfer number already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid warehouse or user reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateStockTransferDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<StockTransferResponseDto> {
    const existing = await this.requireAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (existing.status !== STOCK_TRANSFER_STATUS.DRAFT) {
      throw new BadRequestException(
        'Only a draft stock transfer can be updated',
      );
    }

    const nextFrom = dto.fromWarehouseId ?? existing.from_warehouse_id;
    const nextTo = dto.toWarehouseId ?? existing.to_warehouse_id;
    if (nextFrom === nextTo) {
      throw new BadRequestException(
        'fromWarehouseId and toWarehouseId must differ',
      );
    }
    if (dto.fromWarehouseId) {
      await this.ensureWarehouseInOrg(
        dto.fromWarehouseId,
        existing.organization_id,
      );
    }
    if (dto.toWarehouseId) {
      await this.ensureWarehouseInOrg(
        dto.toWarehouseId,
        existing.organization_id,
      );
    }

    const patch: Partial<{
      transfer_number: string;
      from_warehouse_id: string;
      to_warehouse_id: string;
      requested_by: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.transferNumber !== undefined) {
      patch.transfer_number = dto.transferNumber.trim();
    }
    if (dto.fromWarehouseId !== undefined) {
      patch.from_warehouse_id = dto.fromWarehouseId;
    }
    if (dto.toWarehouseId !== undefined) {
      patch.to_warehouse_id = dto.toWarehouseId;
    }
    if (dto.requestedBy !== undefined) patch.requested_by = dto.requestedBy;

    try {
      await this.db
        .update(stock_transfers)
        .set(patch)
        .where(eq(stock_transfers.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Transfer number already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid warehouse or user reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async transition(
    id: string,
    dto: TransitionStockTransferDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<StockTransferResponseDto> {
    const transfer = await this.requireAccess(
      id,
      currentOrganizationId,
      user,
    );
    try {
      assertStockTransferTransition(transfer.status, dto.toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    await this.db.transaction(async (tx) => {
      if (
        transfer.status === STOCK_TRANSFER_STATUS.DRAFT &&
        dto.toStatus === STOCK_TRANSFER_STATUS.IN_TRANSIT
      ) {
        if (!dto.lines?.length) {
          throw new BadRequestException(
            'lines are required when moving draft → in_transit',
          );
        }
        await this.applyOutLines(tx, transfer, dto.lines, user);
      } else if (
        transfer.status === STOCK_TRANSFER_STATUS.IN_TRANSIT &&
        dto.toStatus === STOCK_TRANSFER_STATUS.COMPLETED
      ) {
        const lines =
          dto.lines?.length
            ? dto.lines
            : await this.loadOutLinesAsTransferLines(id);
        if (!lines.length) {
          throw new BadRequestException(
            'No transfer out movements found to complete',
          );
        }
        await this.applyInLines(tx, transfer, lines, user);
      } else if (
        transfer.status === STOCK_TRANSFER_STATUS.IN_TRANSIT &&
        dto.toStatus === STOCK_TRANSFER_STATUS.CANCELLED
      ) {
        const lines =
          dto.lines?.length
            ? dto.lines
            : await this.loadOutLinesAsTransferLines(id);
        await this.applyReturnToFrom(tx, transfer, lines, user);
      }
      // draft → cancelled: no movements

      const now = nowMysqlDateTime();
      const patch: Partial<{
        status: StockTransferStatus;
        transferred_at: string | null;
        approved_by: string | null;
        updated_at: string;
      }> = {
        status: dto.toStatus,
        updated_at: now,
      };
      if (dto.toStatus === STOCK_TRANSFER_STATUS.COMPLETED) {
        patch.transferred_at = now;
        patch.approved_by = user?.id ?? null;
      }

      await tx
        .update(stock_transfers)
        .set(patch)
        .where(eq(stock_transfers.id, id));
    });

    return this.findOne(id, currentOrganizationId, user);
  }

  private async applyOutLines(
    tx: Tx,
    transfer: StockTransferRow,
    lines: StockTransferLineDto[],
    user?: AuthUser,
  ): Promise<void> {
    for (const line of lines) {
      await this.inventoryMovementsService.applyMovement(
        {
          organizationId: transfer.organization_id,
          productId: line.productId,
          warehouseId: transfer.from_warehouse_id,
          locationId: line.fromLocationId ?? null,
          batchId: line.batchId ?? null,
          movementType: 'out',
          quantity: formatDecimal(Number(line.quantity)),
          referenceType: 'stock_transfer',
          referenceId: transfer.id,
          movedBy: user?.id ?? null,
          notes: `Transfer out → ${transfer.to_warehouse_id}`,
          serialIds: line.serialIds,
        },
        tx,
      );
    }
  }

  private async applyInLines(
    tx: Tx,
    transfer: StockTransferRow,
    lines: StockTransferLineDto[],
    user?: AuthUser,
  ): Promise<void> {
    for (const line of lines) {
      await this.inventoryMovementsService.applyMovement(
        {
          organizationId: transfer.organization_id,
          productId: line.productId,
          warehouseId: transfer.to_warehouse_id,
          locationId: line.toLocationId ?? null,
          batchId: line.batchId ?? null,
          movementType: 'in',
          quantity: formatDecimal(Number(line.quantity)),
          referenceType: 'stock_transfer',
          referenceId: transfer.id,
          movedBy: user?.id ?? null,
          notes: `Transfer in ← ${transfer.from_warehouse_id}`,
          serialIds: line.serialIds,
        },
        tx,
      );
    }
  }

  private async applyReturnToFrom(
    tx: Tx,
    transfer: StockTransferRow,
    lines: StockTransferLineDto[],
    user?: AuthUser,
  ): Promise<void> {
    for (const line of lines) {
      await this.inventoryMovementsService.applyMovement(
        {
          organizationId: transfer.organization_id,
          productId: line.productId,
          warehouseId: transfer.from_warehouse_id,
          locationId: line.fromLocationId ?? null,
          batchId: line.batchId ?? null,
          movementType: 'in',
          quantity: formatDecimal(Number(line.quantity)),
          referenceType: 'stock_transfer',
          referenceId: transfer.id,
          movedBy: user?.id ?? null,
          notes: 'Transfer cancelled — return to source',
          serialIds: line.serialIds,
        },
        tx,
      );
    }
  }

  private async loadOutLinesAsTransferLines(
    transferId: string,
  ): Promise<StockTransferLineDto[]> {
    const rows = await this.db
      .select({
        product_id: inventory_movements.product_id,
        quantity: inventory_movements.quantity,
        location_id: inventory_movements.location_id,
      })
      .from(inventory_movements)
      .where(
        and(
          eq(inventory_movements.reference_type, 'stock_transfer'),
          eq(inventory_movements.reference_id, transferId),
          eq(inventory_movements.movement_type, 'out'),
        ),
      )
      .orderBy(asc(inventory_movements.created_at));

    return rows.map((row) => ({
      productId: row.product_id,
      quantity: row.quantity,
      fromLocationId: row.location_id,
      toLocationId: null,
      batchId: null,
    }));
  }

  private async requireAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<StockTransferRow> {
    const [row] = await this.db
      .select()
      .from(stock_transfers)
      .where(eq(stock_transfers.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Stock transfer ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'stock transfer',
    );
    return row as StockTransferRow;
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
}
