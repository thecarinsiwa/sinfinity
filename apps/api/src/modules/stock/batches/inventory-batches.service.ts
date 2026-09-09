import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, like, type SQL } from 'drizzle-orm';
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
  suppliers,
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
  CreateInventoryBatchDto,
  InventoryBatchResponseDto,
  ListInventoryBatchesQueryDto,
  UpdateInventoryBatchDto,
} from './dto/inventory-batch.dto';

export type InventoryBatchRow = {
  id: string;
  organization_id: string;
  product_id: string;
  batch_number: string;
  manufactured_at: string | null;
  expires_at: string | null;
  supplier_id: string | null;
  created_at: string;
  updated_at: string;
};

function toResponse(row: InventoryBatchRow): InventoryBatchResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    productId: row.product_id,
    batchNumber: row.batch_number,
    manufacturedAt: row.manufactured_at,
    expiresAt: row.expires_at,
    supplierId: row.supplier_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class InventoryBatchesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListInventoryBatchesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<InventoryBatchResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      productId,
      search,
      supplierId,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [
      eq(inventory_batches.organization_id, scopeOrgId),
    ];
    if (productId) {
      parts.push(eq(inventory_batches.product_id, productId));
    }
    if (supplierId) {
      parts.push(eq(inventory_batches.supplier_id, supplierId));
    }
    if (search?.trim()) {
      parts.push(
        like(inventory_batches.batch_number, `%${search.trim()}%`),
      );
    }
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(inventory_batches).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(inventory_batches)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(
          asc(inventory_batches.batch_number),
          asc(inventory_batches.id),
        )
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as InventoryBatchRow[]).map(toResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InventoryBatchResponseDto> {
    return toResponse(
      await this.requireAccess(id, currentOrganizationId, user),
    );
  }

  async create(
    dto: CreateInventoryBatchDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InventoryBatchResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'inventory batch',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureProductInOrg(dto.productId, organizationId);
    if (dto.supplierId) {
      await this.ensureSupplierInOrg(dto.supplierId, organizationId);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(inventory_batches).values({
        id,
        organization_id: organizationId,
        product_id: dto.productId,
        batch_number: dto.batchNumber.trim(),
        manufactured_at: dto.manufacturedAt ?? null,
        expires_at: dto.expiresAt ?? null,
        supplier_id: dto.supplierId ?? null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Batch number already exists for this product',
        );
      }
      throwFkOrRethrow(error, 'Invalid product or supplier reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateInventoryBatchDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InventoryBatchResponseDto> {
    const existing = await this.requireAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (dto.supplierId) {
      await this.ensureSupplierInOrg(
        dto.supplierId,
        existing.organization_id,
      );
    }

    const patch: Partial<{
      batch_number: string;
      manufactured_at: string | null;
      expires_at: string | null;
      supplier_id: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.batchNumber !== undefined) {
      patch.batch_number = dto.batchNumber.trim();
    }
    if (dto.manufacturedAt !== undefined) {
      patch.manufactured_at = dto.manufacturedAt;
    }
    if (dto.expiresAt !== undefined) patch.expires_at = dto.expiresAt;
    if (dto.supplierId !== undefined) patch.supplier_id = dto.supplierId;

    try {
      await this.db
        .update(inventory_batches)
        .set(patch)
        .where(eq(inventory_batches.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Batch number already exists for this product',
        );
      }
      throwFkOrRethrow(error, 'Invalid supplier reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireAccess(id, currentOrganizationId, user);
    try {
      await this.db
        .delete(inventory_batches)
        .where(eq(inventory_batches.id, id));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Batch is referenced by inventory or serial numbers',
      );
    }
  }

  private async requireAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InventoryBatchRow> {
    const [row] = await this.db
      .select()
      .from(inventory_batches)
      .where(eq(inventory_batches.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Inventory batch ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'inventory batch',
    );
    return row as InventoryBatchRow;
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

  private async ensureSupplierInOrg(
    supplierId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: suppliers.id,
        organization_id: suppliers.organization_id,
        deleted_at: suppliers.deleted_at,
      })
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Supplier must belong to the same organization',
      );
    }
  }
}
