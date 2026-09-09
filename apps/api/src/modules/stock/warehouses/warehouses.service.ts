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
  branches,
  inventory,
  warehouse_locations,
  warehouses,
} from '../../../database/schema';
import {
  isMysqlDuplicateError,
  throwDuplicateOrRethrow,
  throwFkOrRethrow,
} from '../../settings/utils/mysql-errors';
import {
  fromBool,
  nowMysqlDateTime,
} from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../stock-scope';
import {
  CreateWarehouseLocationDto,
  ListWarehouseLocationsQueryDto,
  UpdateWarehouseLocationDto,
  WarehouseLocationResponseDto,
} from './dto/warehouse-location.dto';
import {
  CreateWarehouseDto,
  ListWarehousesQueryDto,
  UpdateWarehouseDto,
  WarehouseResponseDto,
} from './dto/warehouse.dto';
import {
  toWarehouseLocationResponse,
  toWarehouseResponse,
  type WarehouseLocationRow,
  type WarehouseRow,
} from './warehouses.mapper';

@Injectable()
export class WarehousesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListWarehousesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<WarehouseResponseDto>> {
    const { page, pageSize, organizationId, search, branchId, isActive } =
      query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWarehouseWhere({
      organizationId: scopeOrgId,
      search,
      branchId,
      isActive,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(warehouses).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(warehouses)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(asc(warehouses.code), asc(warehouses.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as WarehouseRow[]).map(toWarehouseResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<WarehouseResponseDto> {
    const row = await this.requireWarehouseAccess(
      id,
      currentOrganizationId,
      user,
    );
    return toWarehouseResponse(row);
  }

  async create(
    dto: CreateWarehouseDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<WarehouseResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'warehouse',
    );
    await ensureOrganizationExists(this.db, organizationId);
    if (dto.branchId) {
      await this.ensureBranchInOrg(dto.branchId, organizationId);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(warehouses).values({
        id,
        organization_id: organizationId,
        branch_id: dto.branchId ?? null,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        address: dto.address ?? null,
        city_id: dto.cityId ?? null,
        manager_user_id: dto.managerUserId ?? null,
        is_active: fromBool(dto.isActive ?? true),
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Warehouse code already exists for this organization',
        );
      }
      throwFkOrRethrow(
        error,
        'Invalid branch, city or manager user reference',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateWarehouseDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<WarehouseResponseDto> {
    const existing = await this.requireWarehouseAccess(
      id,
      currentOrganizationId,
      user,
    );

    if (dto.branchId) {
      await this.ensureBranchInOrg(dto.branchId, existing.organization_id);
    }

    const patch: Partial<{
      branch_id: string | null;
      code: string;
      name: string;
      address: string | null;
      city_id: string | null;
      manager_user_id: string | null;
      is_active: number;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.branchId !== undefined) patch.branch_id = dto.branchId;
    if (dto.code !== undefined) patch.code = dto.code.trim().toUpperCase();
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.address !== undefined) patch.address = dto.address;
    if (dto.cityId !== undefined) patch.city_id = dto.cityId;
    if (dto.managerUserId !== undefined)
      patch.manager_user_id = dto.managerUserId;
    if (dto.isActive !== undefined) patch.is_active = fromBool(dto.isActive);

    try {
      await this.db.update(warehouses).set(patch).where(eq(warehouses.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Warehouse code already exists for this organization',
        );
      }
      throwFkOrRethrow(
        error,
        'Invalid branch, city or manager user reference',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireWarehouseAccess(id, currentOrganizationId, user);
    await this.assertWarehouseHasNoInventory(id);
    await this.db
      .update(warehouses)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(warehouses.id, id));
  }

  // --- Locations ---

  async listLocations(
    warehouseId: string,
    query: ListWarehouseLocationsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<WarehouseLocationResponseDto[]> {
    await this.requireWarehouseAccess(
      warehouseId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [
      eq(warehouse_locations.warehouse_id, warehouseId),
      isNull(warehouse_locations.deleted_at),
    ];
    if (query.isActive !== undefined) {
      parts.push(
        eq(warehouse_locations.is_active, fromBool(query.isActive)),
      );
    }
    if (query.search?.trim()) {
      parts.push(
        like(warehouse_locations.code, `%${query.search.trim()}%`),
      );
    }
    const rows = await this.db
      .select()
      .from(warehouse_locations)
      .where(and(...parts)!)
      .orderBy(asc(warehouse_locations.code), asc(warehouse_locations.id));
    return (rows as WarehouseLocationRow[]).map(toWarehouseLocationResponse);
  }

  async createLocation(
    warehouseId: string,
    dto: CreateWarehouseLocationDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<WarehouseLocationResponseDto> {
    await this.requireWarehouseAccess(
      warehouseId,
      currentOrganizationId,
      user,
    );
    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(warehouse_locations).values({
        id,
        warehouse_id: warehouseId,
        code: dto.code.trim().toUpperCase(),
        aisle: dto.aisle ?? null,
        rack: dto.rack ?? null,
        shelf: dto.shelf ?? null,
        is_active: fromBool(dto.isActive ?? true),
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Location code already exists in this warehouse',
        );
      }
      throwFkOrRethrow(error, 'Invalid warehouse reference');
    }
    return this.findLocation(warehouseId, id, currentOrganizationId, user);
  }

  async findLocation(
    warehouseId: string,
    locationId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<WarehouseLocationResponseDto> {
    await this.requireWarehouseAccess(
      warehouseId,
      currentOrganizationId,
      user,
    );
    const row = await this.requireLocation(warehouseId, locationId);
    return toWarehouseLocationResponse(row);
  }

  async updateLocation(
    warehouseId: string,
    locationId: string,
    dto: UpdateWarehouseLocationDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<WarehouseLocationResponseDto> {
    await this.requireWarehouseAccess(
      warehouseId,
      currentOrganizationId,
      user,
    );
    await this.requireLocation(warehouseId, locationId);

    const patch: Partial<{
      code: string;
      aisle: string | null;
      rack: string | null;
      shelf: string | null;
      is_active: number;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.code !== undefined) patch.code = dto.code.trim().toUpperCase();
    if (dto.aisle !== undefined) patch.aisle = dto.aisle;
    if (dto.rack !== undefined) patch.rack = dto.rack;
    if (dto.shelf !== undefined) patch.shelf = dto.shelf;
    if (dto.isActive !== undefined) patch.is_active = fromBool(dto.isActive);

    try {
      await this.db
        .update(warehouse_locations)
        .set(patch)
        .where(eq(warehouse_locations.id, locationId));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Location code already exists in this warehouse',
        );
      }
      throw error;
    }

    return this.findLocation(
      warehouseId,
      locationId,
      currentOrganizationId,
      user,
    );
  }

  async removeLocation(
    warehouseId: string,
    locationId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireWarehouseAccess(
      warehouseId,
      currentOrganizationId,
      user,
    );
    await this.requireLocation(warehouseId, locationId);
    await this.assertLocationHasNoInventory(locationId);
    await this.db
      .update(warehouse_locations)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(warehouse_locations.id, locationId));
  }

  private buildWarehouseWhere(params: {
    organizationId: string;
    search?: string;
    branchId?: string;
    isActive?: boolean;
  }): SQL {
    const parts: SQL[] = [
      eq(warehouses.organization_id, params.organizationId),
      isNull(warehouses.deleted_at),
    ];
    if (params.branchId) {
      parts.push(eq(warehouses.branch_id, params.branchId));
    }
    if (params.isActive !== undefined) {
      parts.push(eq(warehouses.is_active, fromBool(params.isActive)));
    }
    if (params.search?.trim()) {
      const term = `%${params.search.trim()}%`;
      parts.push(
        or(like(warehouses.code, term), like(warehouses.name, term))!,
      );
    }
    return and(...parts)!;
  }

  private async requireWarehouseAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<WarehouseRow> {
    const [row] = await this.db
      .select()
      .from(warehouses)
      .where(and(eq(warehouses.id, id), isNull(warehouses.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Warehouse ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'warehouse',
    );
    return row as WarehouseRow;
  }

  private async requireLocation(
    warehouseId: string,
    locationId: string,
  ): Promise<WarehouseLocationRow> {
    const [row] = await this.db
      .select()
      .from(warehouse_locations)
      .where(
        and(
          eq(warehouse_locations.id, locationId),
          eq(warehouse_locations.warehouse_id, warehouseId),
          isNull(warehouse_locations.deleted_at),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Warehouse location ${locationId} not found`,
      );
    }
    return row as WarehouseLocationRow;
  }

  private async ensureBranchInOrg(
    branchId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: branches.id,
        organization_id: branches.organization_id,
        deleted_at: branches.deleted_at,
      })
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Branch ${branchId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Branch must belong to the same organization',
      );
    }
  }

  private async assertWarehouseHasNoInventory(
    warehouseId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: inventory.id })
      .from(inventory)
      .where(eq(inventory.warehouse_id, warehouseId))
      .limit(1);
    if (row) {
      throw new BadRequestException(
        'Cannot delete a warehouse that still has inventory rows',
      );
    }
  }

  private async assertLocationHasNoInventory(
    locationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: inventory.id })
      .from(inventory)
      .where(eq(inventory.location_id, locationId))
      .limit(1);
    if (row) {
      throw new BadRequestException(
        'Cannot delete a location that still has inventory rows',
      );
    }
  }
}
