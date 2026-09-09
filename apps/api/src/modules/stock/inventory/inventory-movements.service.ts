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
  isNull,
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
  inventory,
  inventory_movements,
  products,
  warehouses,
} from '../../../database/schema';
import {
  nowMysqlDateTime,
  toBool,
} from '../../settings/utils/mysql-datetime';
import {
  assertSerialCount,
  parseIntegerQuantity,
} from '../serials/serial-enforcement';
import { SERIAL_NUMBER_STATUS } from '../serials/serial-number-statuses';
import { SerialNumbersService } from '../serials/serial-numbers.service';
import {
  assertOrgAccess,
  requireScopeOrgId,
} from '../stock-scope';
import {
  InventoryMovementResponseDto,
  InventoryResponseDto,
  ListInventoryMovementsQueryDto,
  ListInventoryQueryDto,
} from './dto/inventory.dto';
import {
  toInventoryMovementResponse,
  toInventoryResponse,
  type InventoryMovementRow,
  type InventoryRow,
} from './inventory.mapper';
import {
  applyQuantityDelta,
  formatDecimal,
  type MovementType,
} from './inventory-quantities';

export type ApplyMovementInput = {
  organizationId: string;
  productId: string;
  warehouseId: string;
  locationId?: string | null;
  batchId?: string | null;
  movementType: MovementType;
  /** Absolute > 0 for in/out/reserve/unreserve; signed delta for adjustment. */
  quantity: string;
  referenceType?: string | null;
  referenceId?: string | null;
  movedAt?: string;
  movedBy?: string | null;
  notes?: string | null;
  /** New serial strings to create (inbound / positive adjustment). */
  serialNumbers?: string[];
  /** Existing serial UUIDs (out / reserve / unreserve / transfer / neg adjustment). */
  serialIds?: string[];
  purchaseOrderItemId?: string | null;
  salesOrderItemId?: string | null;
};

export type ApplyMovementResult = {
  inventory: InventoryResponseDto;
  movementId: string;
};

type Tx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];
type DbLike = DrizzleDB | Tx;

/**
 * Sole writer of `inventory` quantities. All stock mutations must go through
 * `applyMovement` (ops, receipts adapter, future delivery). Never update
 * inventory rows from another service.
 */
@Injectable()
export class InventoryMovementsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly serialNumbersService: SerialNumbersService,
  ) {}

  async findInventory(
    query: ListInventoryQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<InventoryResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      productId,
      warehouseId,
      locationId,
      batchId,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildInventoryWhere({
      organizationId: scopeOrgId,
      productId,
      warehouseId,
      locationId,
      batchId,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(inventory).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(inventory)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(asc(inventory.product_id), asc(inventory.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as InventoryRow[]).map(toInventoryResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findInventoryOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InventoryResponseDto> {
    const [row] = await this.db
      .select()
      .from(inventory)
      .where(eq(inventory.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Inventory ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'inventory',
    );
    return toInventoryResponse(row as InventoryRow);
  }

  async findMovements(
    query: ListInventoryMovementsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<InventoryMovementResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      productId,
      warehouseId,
      movementType,
      referenceType,
      referenceId,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [
      eq(inventory_movements.organization_id, scopeOrgId),
    ];
    if (productId) {
      parts.push(eq(inventory_movements.product_id, productId));
    }
    if (warehouseId) {
      parts.push(eq(inventory_movements.warehouse_id, warehouseId));
    }
    if (movementType) {
      parts.push(eq(inventory_movements.movement_type, movementType));
    }
    if (referenceType) {
      parts.push(eq(inventory_movements.reference_type, referenceType));
    }
    if (referenceId) {
      parts.push(eq(inventory_movements.reference_id, referenceId));
    }
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(inventory_movements).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(inventory_movements)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(
          desc(inventory_movements.moved_at),
          asc(inventory_movements.id),
        )
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as InventoryMovementRow[]).map(toInventoryMovementResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  /**
   * Insert inventory_movements and update inventory quantities atomically.
   * Pass `tx` to participate in an outer transaction.
   */
  async applyMovement(
    input: ApplyMovementInput,
    tx?: Tx,
  ): Promise<ApplyMovementResult> {
    if (tx) {
      return this.applyMovementInTx(tx, input);
    }
    return this.db.transaction((inner) =>
      this.applyMovementInTx(inner, input),
    );
  }

  private async applyMovementInTx(
    db: DbLike,
    input: ApplyMovementInput,
  ): Promise<ApplyMovementResult> {
    if ((input.movementType as string) === 'transfer') {
      throw new BadRequestException(
        'movement_type transfer is not applied directly; use out then in',
      );
    }

    await this.ensureWarehouseInOrg(
      db,
      input.warehouseId,
      input.organizationId,
    );
    const product = await this.requireProductInOrg(
      db,
      input.productId,
      input.organizationId,
    );
    const isSerialized = toBool(product.is_serialized);
    this.assertSerialPayload(isSerialized, input);

    const locationId = input.locationId ?? null;
    const batchId = input.batchId ?? null;
    const now = nowMysqlDateTime();

    let row = await this.findInventoryRow(
      db,
      input.warehouseId,
      locationId,
      input.productId,
      batchId,
    );

    if (!row) {
      if (input.movementType !== 'in' && input.movementType !== 'adjustment') {
        throw new BadRequestException(
          'No inventory row for this warehouse/product; receive stock first',
        );
      }
      const id = createId();
      await db.insert(inventory).values({
        id,
        organization_id: input.organizationId,
        warehouse_id: input.warehouseId,
        location_id: locationId,
        product_id: input.productId,
        batch_id: batchId,
        quantity_on_hand: '0.0000',
        quantity_reserved: '0.0000',
        quantity_available: '0.0000',
        created_at: now,
        updated_at: now,
      });
      row = {
        id,
        organization_id: input.organizationId,
        warehouse_id: input.warehouseId,
        location_id: locationId,
        product_id: input.productId,
        batch_id: batchId,
        quantity_on_hand: '0.0000',
        quantity_reserved: '0.0000',
        quantity_available: '0.0000',
        created_at: now,
        updated_at: now,
      };
    }

    let next;
    try {
      next = applyQuantityDelta(
        {
          quantityOnHand: row.quantity_on_hand,
          quantityReserved: row.quantity_reserved,
          quantityAvailable: row.quantity_available,
        },
        input.movementType,
        input.quantity,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid stock movement',
      );
    }

    await db
      .update(inventory)
      .set({
        quantity_on_hand: next.quantityOnHand,
        quantity_reserved: next.quantityReserved,
        quantity_available: next.quantityAvailable,
        updated_at: now,
      })
      .where(eq(inventory.id, row.id));

    const movementId = createId();
    const storedQty =
      input.movementType === 'adjustment'
        ? formatDecimal(Number(input.quantity))
        : formatDecimal(Math.abs(Number(input.quantity)));

    await db.insert(inventory_movements).values({
      id: movementId,
      organization_id: input.organizationId,
      product_id: input.productId,
      warehouse_id: input.warehouseId,
      location_id: locationId,
      movement_type: input.movementType,
      quantity: storedQty,
      reference_type: input.referenceType ?? null,
      reference_id: input.referenceId ?? null,
      moved_at: input.movedAt ?? now,
      moved_by: input.movedBy ?? null,
      notes: input.notes ?? null,
      created_at: now,
    });

    if (isSerialized) {
      await this.applySerializedSideEffects(db, input, now);
    }

    return {
      inventory: toInventoryResponse({
        ...row,
        quantity_on_hand: next.quantityOnHand,
        quantity_reserved: next.quantityReserved,
        quantity_available: next.quantityAvailable,
        updated_at: now,
      }),
      movementId,
    };
  }

  private assertSerialPayload(
    isSerialized: boolean,
    input: ApplyMovementInput,
  ): void {
    const hasSerials =
      (input.serialNumbers?.length ?? 0) > 0 ||
      (input.serialIds?.length ?? 0) > 0;
    if (!isSerialized) {
      if (hasSerials) {
        throw new BadRequestException(
          'Product is not serialized; omit serialNumbers/serialIds',
        );
      }
      return;
    }

    try {
      const qtyAbs =
        input.movementType === 'adjustment'
          ? Math.abs(parseIntegerQuantity(input.quantity))
          : parseIntegerQuantity(input.quantity);
      if (qtyAbs <= 0) {
        throw new Error('Serialized movement quantity must be positive');
      }

      const isTransferIn =
        input.movementType === 'in' &&
        input.referenceType === 'stock_transfer';
      const createsSerials =
        (input.movementType === 'in' && !isTransferIn) ||
        (input.movementType === 'adjustment' && Number(input.quantity) > 0);

      if (createsSerials) {
        assertSerialCount(qtyAbs, input.serialNumbers, 'serialNumbers');
      } else {
        assertSerialCount(qtyAbs, input.serialIds, 'serialIds');
      }
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid serial payload',
      );
    }
  }

  private async applySerializedSideEffects(
    db: DbLike,
    input: ApplyMovementInput,
    now: string,
  ): Promise<void> {
    const isTransfer =
      input.referenceType === 'stock_transfer';
    const qty = Number(input.quantity);

    if (
      input.movementType === 'in' &&
      !isTransfer &&
      input.serialNumbers?.length
    ) {
      await this.serialNumbersService.createInboundSerials(db, {
        organizationId: input.organizationId,
        productId: input.productId,
        warehouseId: input.warehouseId,
        batchId: input.batchId,
        serialNumbers: input.serialNumbers,
        purchaseOrderItemId: input.purchaseOrderItemId,
        now,
      });
      return;
    }

    if (
      input.movementType === 'adjustment' &&
      qty > 0 &&
      input.serialNumbers?.length
    ) {
      await this.serialNumbersService.createInboundSerials(db, {
        organizationId: input.organizationId,
        productId: input.productId,
        warehouseId: input.warehouseId,
        batchId: input.batchId,
        serialNumbers: input.serialNumbers,
        now,
      });
      return;
    }

    if (!input.serialIds?.length) {
      return;
    }

    if (input.movementType === 'in' && isTransfer) {
      await this.serialNumbersService.applySerialIdsForMovement(db, {
        organizationId: input.organizationId,
        productId: input.productId,
        warehouseId: input.warehouseId,
        serialIds: input.serialIds,
        expectedStatus: SERIAL_NUMBER_STATUS.IN_STOCK,
        nextWarehouseId: input.warehouseId,
        skipWarehouseCheck: true,
        now,
      });
      return;
    }

    if (input.movementType === 'out' && isTransfer) {
      await this.serialNumbersService.applySerialIdsForMovement(db, {
        organizationId: input.organizationId,
        productId: input.productId,
        warehouseId: input.warehouseId,
        serialIds: input.serialIds,
        expectedStatus: SERIAL_NUMBER_STATUS.IN_STOCK,
        now,
      });
      return;
    }

    if (input.movementType === 'reserve') {
      await this.serialNumbersService.applySerialIdsForMovement(db, {
        organizationId: input.organizationId,
        productId: input.productId,
        warehouseId: input.warehouseId,
        serialIds: input.serialIds,
        expectedStatus: SERIAL_NUMBER_STATUS.IN_STOCK,
        nextStatus: SERIAL_NUMBER_STATUS.RESERVED,
        salesOrderItemId: input.salesOrderItemId,
        now,
      });
      return;
    }

    if (input.movementType === 'unreserve') {
      await this.serialNumbersService.applySerialIdsForMovement(db, {
        organizationId: input.organizationId,
        productId: input.productId,
        warehouseId: input.warehouseId,
        serialIds: input.serialIds,
        expectedStatus: SERIAL_NUMBER_STATUS.RESERVED,
        nextStatus: SERIAL_NUMBER_STATUS.IN_STOCK,
        salesOrderItemId: null,
        now,
      });
      return;
    }

    if (input.movementType === 'out') {
      await this.serialNumbersService.applySerialIdsForMovement(db, {
        organizationId: input.organizationId,
        productId: input.productId,
        warehouseId: input.warehouseId,
        serialIds: input.serialIds,
        expectedStatus: SERIAL_NUMBER_STATUS.IN_STOCK,
        nextStatus: SERIAL_NUMBER_STATUS.SHIPPED,
        salesOrderItemId: input.salesOrderItemId,
        now,
      });
      return;
    }

    if (input.movementType === 'adjustment' && qty < 0) {
      await this.serialNumbersService.applySerialIdsForMovement(db, {
        organizationId: input.organizationId,
        productId: input.productId,
        warehouseId: input.warehouseId,
        serialIds: input.serialIds,
        expectedStatus: SERIAL_NUMBER_STATUS.IN_STOCK,
        nextStatus: SERIAL_NUMBER_STATUS.SCRAPPED,
        nextWarehouseId: null,
        now,
      });
    }
  }

  private async findInventoryRow(
    db: DbLike,
    warehouseId: string,
    locationId: string | null,
    productId: string,
    batchId: string | null,
  ): Promise<InventoryRow | null> {
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
    const [row] = await db
      .select()
      .from(inventory)
      .where(and(...parts)!)
      .limit(1);
    return (row as InventoryRow | undefined) ?? null;
  }

  private buildInventoryWhere(params: {
    organizationId: string;
    productId?: string;
    warehouseId?: string;
    locationId?: string;
    batchId?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(inventory.organization_id, params.organizationId),
    ];
    if (params.productId) {
      parts.push(eq(inventory.product_id, params.productId));
    }
    if (params.warehouseId) {
      parts.push(eq(inventory.warehouse_id, params.warehouseId));
    }
    if (params.locationId) {
      parts.push(eq(inventory.location_id, params.locationId));
    }
    if (params.batchId) {
      parts.push(eq(inventory.batch_id, params.batchId));
    }
    return and(...parts)!;
  }

  private async ensureWarehouseInOrg(
    db: DbLike,
    warehouseId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await db
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

  private async requireProductInOrg(
    db: DbLike,
    productId: string,
    organizationId: string,
  ): Promise<{
    id: string;
    organization_id: string;
    is_serialized: number;
  }> {
    const [row] = await db
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
    return {
      id: row.id,
      organization_id: row.organization_id,
      is_serialized: row.is_serialized,
    };
  }
}
