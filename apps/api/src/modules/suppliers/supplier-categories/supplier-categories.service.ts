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
import { supplier_categories } from '../../../database/schema';
import { throwDuplicateOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../suppliers-scope';
import { CreateSupplierCategoryDto } from './dto/create-supplier-category.dto';
import { ListSupplierCategoriesQueryDto } from './dto/list-supplier-categories-query.dto';
import { SupplierCategoryResponseDto } from './dto/supplier-category-response.dto';
import { UpdateSupplierCategoryDto } from './dto/update-supplier-category.dto';
import {
  toSupplierCategoryResponse,
  type SupplierCategoryRow,
} from './supplier-categories.mapper';

@Injectable()
export class SupplierCategoriesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListSupplierCategoriesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<SupplierCategoryResponseDto>> {
    const { page, pageSize, search, organizationId } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({ organizationId: scopeOrgId, search });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(supplier_categories).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(supplier_categories)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(asc(supplier_categories.code))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as SupplierCategoryRow[]).map(toSupplierCategoryResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierCategoryResponseDto> {
    const row = await this.findActiveRowById(id);
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'supplier category',
    );
    return toSupplierCategoryResponse(row);
  }

  async create(
    dto: CreateSupplierCategoryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierCategoryResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'supplier category',
    );
    await ensureOrganizationExists(this.db, organizationId);

    const id = createId();
    try {
      await this.db.insert(supplier_categories).values({
        id,
        organization_id: organizationId,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
      });
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Supplier category code already exists for this organization',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateSupplierCategoryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierCategoryResponseDto> {
    const existing = await this.findActiveRowById(id);
    assertOrgAccess(
      existing.organization_id,
      currentOrganizationId,
      user,
      'supplier category',
    );

    if (dto.organizationId !== undefined) {
      assertOrgAccess(
        dto.organizationId,
        currentOrganizationId,
        user,
        'supplier category',
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
        .update(supplier_categories)
        .set(patch)
        .where(eq(supplier_categories.id, id));
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Supplier category code already exists for this organization',
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
      'supplier category',
    );

    await this.db
      .update(supplier_categories)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(supplier_categories.id, id));
  }

  private async findActiveRowById(id: string): Promise<SupplierCategoryRow> {
    const [row] = await this.db
      .select()
      .from(supplier_categories)
      .where(
        and(
          eq(supplier_categories.id, id),
          isNull(supplier_categories.deleted_at),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Supplier category ${id} not found`);
    }
    return row as SupplierCategoryRow;
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(supplier_categories.organization_id, params.organizationId),
      isNull(supplier_categories.deleted_at),
    ];
    if (params.search) {
      parts.push(
        or(
          like(supplier_categories.code, `%${params.search}%`),
          like(supplier_categories.name, `%${params.search}%`),
        )!,
      );
    }
    return and(...parts)!;
  }
}
