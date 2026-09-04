import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, eq, isNull, like, or, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { service_categories } from '../../../database/schema';
import { throwDuplicateOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../catalogue-scope';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { ListServiceCategoriesQueryDto } from './dto/list-service-categories-query.dto';
import { ServiceCategoryResponseDto } from './dto/service-category-response.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import {
  toServiceCategoryResponse,
  type ServiceCategoryRow,
} from './service-categories.mapper';

@Injectable()
export class ServiceCategoriesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListServiceCategoriesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<ServiceCategoryResponseDto>> {
    const { page, pageSize, search, organizationId } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({ organizationId: scopeOrgId, search });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(service_categories).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(service_categories)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(asc(service_categories.code))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as ServiceCategoryRow[]).map(toServiceCategoryResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ServiceCategoryResponseDto> {
    const row = await this.findActiveRowById(id);
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'service category',
    );
    return toServiceCategoryResponse(row);
  }

  async create(
    dto: CreateServiceCategoryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ServiceCategoryResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'service category',
    );
    await ensureOrganizationExists(this.db, organizationId);

    const id = createId();
    try {
      await this.db.insert(service_categories).values({
        id,
        organization_id: organizationId,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
      });
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Service category code already exists for this organization',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateServiceCategoryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ServiceCategoryResponseDto> {
    const existing = await this.findActiveRowById(id);
    assertOrgAccess(
      existing.organization_id,
      currentOrganizationId,
      user,
      'service category',
    );

    if (dto.organizationId !== undefined) {
      assertOrgAccess(
        dto.organizationId,
        currentOrganizationId,
        user,
        'service category',
      );
      await ensureOrganizationExists(this.db, dto.organizationId);
    }

    const patch: Partial<{
      organization_id: string;
      code: string;
      name: string;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.organizationId !== undefined)
      patch.organization_id = dto.organizationId;
    if (dto.code !== undefined) patch.code = dto.code.trim().toUpperCase();
    if (dto.name !== undefined) patch.name = dto.name.trim();

    try {
      await this.db
        .update(service_categories)
        .set(patch)
        .where(eq(service_categories.id, id));
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Service category code already exists for this organization',
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
    assertOrgAccess(
      existing.organization_id,
      currentOrganizationId,
      user,
      'service category',
    );

    await this.db
      .update(service_categories)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(service_categories.id, id));
  }

  private async findActiveRowById(id: string): Promise<ServiceCategoryRow> {
    const [row] = await this.db
      .select()
      .from(service_categories)
      .where(
        and(eq(service_categories.id, id), isNull(service_categories.deleted_at)),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Service category ${id} not found`);
    }
    return row as ServiceCategoryRow;
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(service_categories.organization_id, params.organizationId),
      isNull(service_categories.deleted_at),
    ];
    if (params.search) {
      parts.push(
        or(
          like(service_categories.code, `%${params.search}%`),
          like(service_categories.name, `%${params.search}%`),
        )!,
      );
    }
    return and(...parts)!;
  }
}
