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
import { customer_categories } from '../../../database/schema';
import { throwDuplicateOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../crm-scope';
import { CreateCustomerCategoryDto } from './dto/create-customer-category.dto';
import { ListCustomerCategoriesQueryDto } from './dto/list-customer-categories-query.dto';
import { CustomerCategoryResponseDto } from './dto/customer-category-response.dto';
import { UpdateCustomerCategoryDto } from './dto/update-customer-category.dto';
import {
  toCustomerCategoryResponse,
  type CustomerCategoryRow,
} from './customer-categories.mapper';

@Injectable()
export class CustomerCategoriesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListCustomerCategoriesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<CustomerCategoryResponseDto>> {
    const { page, pageSize, search, organizationId } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({ organizationId: scopeOrgId, search });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(customer_categories).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(customer_categories)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(asc(customer_categories.code))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as CustomerCategoryRow[]).map(toCustomerCategoryResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomerCategoryResponseDto> {
    const row = await this.findActiveRowById(id);
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'customer category',
    );
    return toCustomerCategoryResponse(row);
  }

  async create(
    dto: CreateCustomerCategoryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomerCategoryResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'customer category',
    );
    await ensureOrganizationExists(this.db, organizationId);

    const id = createId();
    try {
      await this.db.insert(customer_categories).values({
        id,
        organization_id: organizationId,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        description: dto.description ?? null,
      });
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Customer category code already exists for this organization',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateCustomerCategoryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CustomerCategoryResponseDto> {
    const existing = await this.findActiveRowById(id);
    assertOrgAccess(
      existing.organization_id,
      currentOrganizationId,
      user,
      'customer category',
    );

    if (dto.organizationId !== undefined) {
      assertOrgAccess(
        dto.organizationId,
        currentOrganizationId,
        user,
        'customer category',
      );
      await ensureOrganizationExists(this.db, dto.organizationId);
    }

    const patch: Partial<{
      organization_id: string;
      code: string;
      name: string;
      description: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.organizationId !== undefined)
      patch.organization_id = dto.organizationId;
    if (dto.code !== undefined) patch.code = dto.code.trim().toUpperCase();
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.description !== undefined) patch.description = dto.description;

    try {
      await this.db
        .update(customer_categories)
        .set(patch)
        .where(eq(customer_categories.id, id));
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Customer category code already exists for this organization',
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
      'customer category',
    );

    await this.db
      .update(customer_categories)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(customer_categories.id, id));
  }

  private async findActiveRowById(id: string): Promise<CustomerCategoryRow> {
    const [row] = await this.db
      .select()
      .from(customer_categories)
      .where(
        and(
          eq(customer_categories.id, id),
          isNull(customer_categories.deleted_at),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Customer category ${id} not found`);
    }
    return row as CustomerCategoryRow;
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(customer_categories.organization_id, params.organizationId),
      isNull(customer_categories.deleted_at),
    ];
    if (params.search) {
      parts.push(
        or(
          like(customer_categories.code, `%${params.search}%`),
          like(customer_categories.name, `%${params.search}%`),
        )!,
      );
    }
    return and(...parts)!;
  }
}
