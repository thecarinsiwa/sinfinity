import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, inArray, like, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  inventory_batches,
  products,
  serial_numbers,
  warehouses,
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
} from '../stock-scope';
import {
  CreateSerialNumberDto,
  ListSerialNumbersQueryDto,
  SerialNumberResponseDto,
  TransitionSerialNumberDto,
  UpdateSerialNumberDto,
} from './dto/serial-number.dto';
import {
  assertSerialNumberTransition,
  SERIAL_NUMBER_STATUS,
  type SerialNumberStatus,
} from './serial-number-statuses';

export type SerialNumberRow = {
  id: string;
  organization_id: string;
  product_id: string;
  serial_number: string;
  batch_id: string | null;
  warehouse_id: string | null;
  status: SerialNumberStatus;
  purchase_order_item_id: string | null;
  sales_order_item_id: string | null;
  created_at: string;
  updated_at: string;
};

type Tx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];
type DbLike = DrizzleDB | Tx;

function toResponse(row: SerialNumberRow): SerialNumberResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    productId: row.product_id,
    serialNumber: row.serial_number,
    batchId: row.batch_id,
    warehouseId: row.warehouse_id,
    status: row.status,
    purchaseOrderItemId: row.purchase_order_item_id,
    salesOrderItemId: row.sales_order_item_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class SerialNumbersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListSerialNumbersQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<SerialNumberResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      productId,
      warehouseId,
      batchId,
      status,
      search,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [eq(serial_numbers.organization_id, scopeOrgId)];
    if (productId) parts.push(eq(serial_numbers.product_id, productId));
    if (warehouseId) {
      parts.push(eq(serial_numbers.warehouse_id, warehouseId));
    }
    if (batchId) parts.push(eq(serial_numbers.batch_id, batchId));
    if (status) parts.push(eq(serial_numbers.status, status));
    if (search?.trim()) {
      parts.push(like(serial_numbers.serial_number, `%${search.trim()}%`));
    }
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(serial_numbers).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(serial_numbers)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(asc(serial_numbers.serial_number), asc(serial_numbers.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as SerialNumberRow[]).map(toResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SerialNumberResponseDto> {
    return toResponse(
      await this.requireAccess(id, currentOrganizationId, user),
    );
  }

  async create(
    dto: CreateSerialNumberDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SerialNumberResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'serial number',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureProductInOrg(this.db, dto.productId, organizationId);
    if (dto.warehouseId) {
      await this.ensureWarehouseInOrg(
        this.db,
        dto.warehouseId,
        organizationId,
      );
    }
    if (dto.batchId) {
      await this.ensureBatchInOrg(
        this.db,
        dto.batchId,
        organizationId,
        dto.productId,
      );
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(serial_numbers).values({
        id,
        organization_id: organizationId,
        product_id: dto.productId,
        serial_number: dto.serialNumber.trim(),
        batch_id: dto.batchId ?? null,
        warehouse_id: dto.warehouseId ?? null,
        status: dto.status ?? SERIAL_NUMBER_STATUS.IN_STOCK,
        purchase_order_item_id: dto.purchaseOrderItemId ?? null,
        sales_order_item_id: dto.salesOrderItemId ?? null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Serial number already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid product, batch or warehouse reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateSerialNumberDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SerialNumberResponseDto> {
    const existing = await this.requireAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (
      existing.status === SERIAL_NUMBER_STATUS.SHIPPED ||
      existing.status === SERIAL_NUMBER_STATUS.INSTALLED ||
      existing.status === SERIAL_NUMBER_STATUS.SCRAPPED
    ) {
      throw new BadRequestException(
        `Cannot update a serial number in status "${existing.status}"`,
      );
    }

    if (dto.warehouseId) {
      await this.ensureWarehouseInOrg(
        this.db,
        dto.warehouseId,
        existing.organization_id,
      );
    }
    if (dto.batchId) {
      await this.ensureBatchInOrg(
        this.db,
        dto.batchId,
        existing.organization_id,
        existing.product_id,
      );
    }

    const patch: Partial<{
      serial_number: string;
      batch_id: string | null;
      warehouse_id: string | null;
      purchase_order_item_id: string | null;
      sales_order_item_id: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.serialNumber !== undefined) {
      patch.serial_number = dto.serialNumber.trim();
    }
    if (dto.batchId !== undefined) patch.batch_id = dto.batchId;
    if (dto.warehouseId !== undefined) patch.warehouse_id = dto.warehouseId;
    if (dto.purchaseOrderItemId !== undefined) {
      patch.purchase_order_item_id = dto.purchaseOrderItemId;
    }
    if (dto.salesOrderItemId !== undefined) {
      patch.sales_order_item_id = dto.salesOrderItemId;
    }

    try {
      await this.db
        .update(serial_numbers)
        .set(patch)
        .where(eq(serial_numbers.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Serial number already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid batch or warehouse reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async transition(
    id: string,
    dto: TransitionSerialNumberDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SerialNumberResponseDto> {
    const existing = await this.requireAccess(
      id,
      currentOrganizationId,
      user,
    );
    try {
      assertSerialNumberTransition(existing.status, dto.toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    const patch: Partial<{
      status: SerialNumberStatus;
      warehouse_id: string | null;
      updated_at: string;
    }> = {
      status: dto.toStatus,
      updated_at: nowMysqlDateTime(),
    };

    if (dto.warehouseId !== undefined) {
      if (dto.warehouseId) {
        await this.ensureWarehouseInOrg(
          this.db,
          dto.warehouseId,
          existing.organization_id,
        );
      }
      patch.warehouse_id = dto.warehouseId;
    } else if (dto.toStatus === SERIAL_NUMBER_STATUS.SHIPPED) {
      // keep warehouse as last known
    } else if (dto.toStatus === SERIAL_NUMBER_STATUS.SCRAPPED) {
      patch.warehouse_id = null;
    }

    await this.db
      .update(serial_numbers)
      .set(patch)
      .where(eq(serial_numbers.id, id));

    return this.findOne(id, currentOrganizationId, user);
  }

  /** Used by applyMovement for inbound create / status sync. */
  async createInboundSerials(
    db: DbLike,
    params: {
      organizationId: string;
      productId: string;
      warehouseId: string;
      batchId?: string | null;
      serialNumbers: string[];
      purchaseOrderItemId?: string | null;
      now: string;
    },
  ): Promise<void> {
    for (const sn of params.serialNumbers) {
      const id = createId();
      try {
        await db.insert(serial_numbers).values({
          id,
          organization_id: params.organizationId,
          product_id: params.productId,
          serial_number: sn.trim(),
          batch_id: params.batchId ?? null,
          warehouse_id: params.warehouseId,
          status: SERIAL_NUMBER_STATUS.IN_STOCK,
          purchase_order_item_id: params.purchaseOrderItemId ?? null,
          sales_order_item_id: null,
          created_at: params.now,
          updated_at: params.now,
        });
      } catch (error) {
        if (isMysqlDuplicateError(error)) {
          throwDuplicateOrRethrow(
            error,
            `Serial number "${sn}" already exists for this organization`,
          );
        }
        throwFkOrRethrow(error, 'Invalid serial number reference');
      }
    }
  }

  async applySerialIdsForMovement(
    db: DbLike,
    params: {
      organizationId: string;
      productId: string;
      warehouseId: string;
      serialIds: string[];
      expectedStatus: SerialNumberStatus;
      nextStatus?: SerialNumberStatus;
      nextWarehouseId?: string | null;
      salesOrderItemId?: string | null;
      /** When true, do not require serial.warehouse_id === warehouseId (transfer in). */
      skipWarehouseCheck?: boolean;
      now: string;
    },
  ): Promise<void> {
    const rows = await db
      .select()
      .from(serial_numbers)
      .where(inArray(serial_numbers.id, params.serialIds));

    if (rows.length !== params.serialIds.length) {
      throw new BadRequestException(
        'One or more serialIds were not found',
      );
    }

    for (const row of rows as SerialNumberRow[]) {
      if (row.organization_id !== params.organizationId) {
        throw new BadRequestException(
          'Serial number must belong to the same organization',
        );
      }
      if (row.product_id !== params.productId) {
        throw new BadRequestException(
          'Serial number product does not match movement product',
        );
      }
      if (row.status !== params.expectedStatus) {
        throw new BadRequestException(
          `Serial ${row.serial_number} must be "${params.expectedStatus}" (is "${row.status}")`,
        );
      }
      if (
        !params.skipWarehouseCheck &&
        (params.expectedStatus === SERIAL_NUMBER_STATUS.IN_STOCK ||
          params.expectedStatus === SERIAL_NUMBER_STATUS.RESERVED) &&
        row.warehouse_id !== params.warehouseId
      ) {
        throw new BadRequestException(
          `Serial ${row.serial_number} is not in warehouse ${params.warehouseId}`,
        );
      }

      const patch: Partial<{
        status: SerialNumberStatus;
        warehouse_id: string | null;
        sales_order_item_id: string | null;
        updated_at: string;
      }> = { updated_at: params.now };

      if (params.nextStatus !== undefined) {
        patch.status = params.nextStatus;
      }
      if (params.nextWarehouseId !== undefined) {
        patch.warehouse_id = params.nextWarehouseId;
      }
      if (params.salesOrderItemId !== undefined) {
        patch.sales_order_item_id = params.salesOrderItemId;
      }

      await db
        .update(serial_numbers)
        .set(patch)
        .where(eq(serial_numbers.id, row.id));
    }
  }

  private async requireAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SerialNumberRow> {
    const [row] = await this.db
      .select()
      .from(serial_numbers)
      .where(eq(serial_numbers.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Serial number ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'serial number',
    );
    return row as SerialNumberRow;
  }

  private async ensureProductInOrg(
    db: DbLike,
    productId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await db
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

  private async ensureBatchInOrg(
    db: DbLike,
    batchId: string,
    organizationId: string,
    productId: string,
  ): Promise<void> {
    const [row] = await db
      .select({
        id: inventory_batches.id,
        organization_id: inventory_batches.organization_id,
        product_id: inventory_batches.product_id,
      })
      .from(inventory_batches)
      .where(eq(inventory_batches.id, batchId))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Inventory batch ${batchId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Batch must belong to the same organization',
      );
    }
    if (row.product_id !== productId) {
      throw new BadRequestException(
        'Batch must belong to the same product',
      );
    }
  }
}
