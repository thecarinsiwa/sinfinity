import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, isNull, like, or, type SQL } from 'drizzle-orm';
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
  cities,
  organizations,
} from '../../../database/schema';
import {
  throwDuplicateOrRethrow,
  throwFkOrRethrow,
} from '../../settings/utils/mysql-errors';
import {
  fromBool,
  nowMysqlDateTime,
} from '../../settings/utils/mysql-datetime';
import { toBranchResponse, type BranchRow } from './branches.mapper';
import { CreateBranchDto } from './dto/create-branch.dto';
import { BranchResponseDto } from './dto/branch-response.dto';
import { ListBranchesQueryDto } from './dto/list-branches-query.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListBranchesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<BranchResponseDto>> {
    const { page, pageSize, search, type, isActive, organizationId } = query;
    const scopeOrgId = this.resolveScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      search,
      type,
      isActive,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(branches).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(branches)
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery.orderBy(branches.code).limit(pageSize).offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as BranchRow[]).map(toBranchResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<BranchResponseDto> {
    const row = await this.findActiveRowById(id);
    this.assertOrgAccess(row.organization_id, currentOrganizationId, user);
    return toBranchResponse(row);
  }

  async create(
    dto: CreateBranchDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<BranchResponseDto> {
    const organizationId = this.requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
    );
    await this.ensureOrganizationExists(organizationId);
    await this.ensureCity(dto.cityId);

    const id = createId();

    try {
      await this.db.insert(branches).values({
        id,
        organization_id: organizationId,
        code: dto.code.toUpperCase(),
        name: dto.name,
        type: dto.type ?? 'office',
        address: dto.address ?? null,
        city_id: dto.cityId ?? null,
        phone: dto.phone ?? null,
        manager_user_id: dto.managerUserId ?? null,
        is_active: fromBool(dto.isActive ?? true),
      });
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Branch code already exists for this organization',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateBranchDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<BranchResponseDto> {
    const existing = await this.findActiveRowById(id);
    this.assertOrgAccess(existing.organization_id, currentOrganizationId, user);

    if (dto.organizationId !== undefined) {
      this.assertOrgAccess(dto.organizationId, currentOrganizationId, user);
      await this.ensureOrganizationExists(dto.organizationId);
    }
    if (dto.cityId !== undefined) {
      await this.ensureCity(dto.cityId);
    }

    const patch: Partial<{
      organization_id: string;
      code: string;
      name: string;
      type: CreateBranchDto['type'];
      address: string | null;
      city_id: string | null;
      phone: string | null;
      manager_user_id: string | null;
      is_active: number;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.organizationId !== undefined) {
      patch.organization_id = dto.organizationId;
    }
    if (dto.code !== undefined) patch.code = dto.code.toUpperCase();
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.type !== undefined) patch.type = dto.type;
    if (dto.address !== undefined) patch.address = dto.address;
    if (dto.cityId !== undefined) patch.city_id = dto.cityId;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.managerUserId !== undefined) {
      patch.manager_user_id = dto.managerUserId;
    }
    if (dto.isActive !== undefined) patch.is_active = fromBool(dto.isActive);

    try {
      await this.db.update(branches).set(patch).where(eq(branches.id, id));
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Branch code already exists for this organization',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const existing = await this.findActiveRowById(id);
    this.assertOrgAccess(existing.organization_id, currentOrganizationId, user);

    try {
      await this.db
        .update(branches)
        .set({
          deleted_at: nowMysqlDateTime(),
          updated_at: nowMysqlDateTime(),
        })
        .where(eq(branches.id, id));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Branch is referenced by other records and cannot be deleted',
      );
    }
  }

  private requireOrgId(
    dtoOrgId: string | undefined,
    currentOrganizationId: string | undefined,
    user?: AuthUser,
  ): string {
    if (user?.isSuperAdmin && dtoOrgId) {
      return dtoOrgId;
    }
    const organizationId = dtoOrgId ?? currentOrganizationId ?? user?.organizationId;
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }
    if (
      user &&
      !user.isSuperAdmin &&
      dtoOrgId &&
      dtoOrgId !== user.organizationId
    ) {
      throw new ForbiddenException('Cannot create a branch in another organization');
    }
    return organizationId;
  }

  private resolveScopeOrgId(
    queryOrgId: string | undefined,
    currentOrganizationId: string | undefined,
    user?: AuthUser,
  ): string | undefined {
    if (user?.isSuperAdmin) {
      return queryOrgId ?? currentOrganizationId;
    }
    return currentOrganizationId ?? user?.organizationId ?? queryOrgId;
  }

  private assertOrgAccess(
    organizationId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): void {
    if (!user || user.isSuperAdmin) {
      return;
    }
    const scope = currentOrganizationId ?? user.organizationId;
    if (scope && scope !== organizationId) {
      throw new ForbiddenException('Cannot access a branch in another organization');
    }
  }

  private async findActiveRowById(id: string): Promise<BranchRow> {
    const [row] = await this.db
      .select()
      .from(branches)
      .where(and(eq(branches.id, id), isNull(branches.deleted_at)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Branch ${id} not found`);
    }

    return row as BranchRow;
  }

  private async ensureOrganizationExists(organizationId: string): Promise<void> {
    const [row] = await this.db
      .select({ id: organizations.id })
      .from(organizations)
      .where(
        and(eq(organizations.id, organizationId), isNull(organizations.deleted_at)),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }
  }

  private async ensureCity(cityId?: string | null): Promise<void> {
    if (!cityId) {
      return;
    }
    const [row] = await this.db
      .select({ id: cities.id })
      .from(cities)
      .where(eq(cities.id, cityId))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`City ${cityId} not found`);
    }
  }

  private buildWhere(params: {
    organizationId?: string;
    search?: string;
    type?: string;
    isActive?: boolean;
  }): SQL | undefined {
    const parts: SQL[] = [isNull(branches.deleted_at)];

    if (params.organizationId) {
      parts.push(eq(branches.organization_id, params.organizationId));
    }
    if (params.search) {
      parts.push(
        or(
          like(branches.code, `%${params.search}%`),
          like(branches.name, `%${params.search}%`),
        )!,
      );
    }
    if (params.type) {
      parts.push(eq(branches.type, params.type as BranchRow['type']));
    }
    if (params.isActive !== undefined) {
      parts.push(eq(branches.is_active, fromBool(params.isActive)));
    }

    return and(...parts);
  }
}
