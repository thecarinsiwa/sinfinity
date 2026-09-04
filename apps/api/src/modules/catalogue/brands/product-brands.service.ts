import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, eq, isNull, like, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { product_brands } from '../../../database/schema';
import { throwDuplicateOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../catalogue-scope';
import { CreateProductBrandDto } from './dto/create-product-brand.dto';
import { ListProductBrandsQueryDto } from './dto/list-product-brands-query.dto';
import { ProductBrandResponseDto } from './dto/product-brand-response.dto';
import { UpdateProductBrandDto } from './dto/update-product-brand.dto';
import {
  toProductBrandResponse,
  type ProductBrandRow,
} from './product-brands.mapper';

@Injectable()
export class ProductBrandsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListProductBrandsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<ProductBrandResponseDto>> {
    const { page, pageSize, search, organizationId } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({ organizationId: scopeOrgId, search });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(product_brands).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(product_brands)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(asc(product_brands.name))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as ProductBrandRow[]).map(toProductBrandResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductBrandResponseDto> {
    const row = await this.findActiveRowById(id);
    assertOrgAccess(row.organization_id, currentOrganizationId, user, 'brand');
    return toProductBrandResponse(row);
  }

  async create(
    dto: CreateProductBrandDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductBrandResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'brand',
    );
    await ensureOrganizationExists(this.db, organizationId);

    const id = createId();
    try {
      await this.db.insert(product_brands).values({
        id,
        organization_id: organizationId,
        name: dto.name.trim(),
        logo_url: dto.logoUrl ?? null,
        website: dto.website ?? null,
      });
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Brand name already exists for this organization',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateProductBrandDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductBrandResponseDto> {
    const existing = await this.findActiveRowById(id);
    assertOrgAccess(
      existing.organization_id,
      currentOrganizationId,
      user,
      'brand',
    );

    if (dto.organizationId !== undefined) {
      assertOrgAccess(dto.organizationId, currentOrganizationId, user, 'brand');
      await ensureOrganizationExists(this.db, dto.organizationId);
    }

    const patch: Partial<{
      organization_id: string;
      name: string;
      logo_url: string | null;
      website: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.organizationId !== undefined)
      patch.organization_id = dto.organizationId;
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.logoUrl !== undefined) patch.logo_url = dto.logoUrl;
    if (dto.website !== undefined) patch.website = dto.website;

    try {
      await this.db
        .update(product_brands)
        .set(patch)
        .where(eq(product_brands.id, id));
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Brand name already exists for this organization',
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
      'brand',
    );

    await this.db
      .update(product_brands)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(product_brands.id, id));
  }

  private async findActiveRowById(id: string): Promise<ProductBrandRow> {
    const [row] = await this.db
      .select()
      .from(product_brands)
      .where(and(eq(product_brands.id, id), isNull(product_brands.deleted_at)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Product brand ${id} not found`);
    }
    return row as ProductBrandRow;
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(product_brands.organization_id, params.organizationId),
      isNull(product_brands.deleted_at),
    ];
    if (params.search) {
      parts.push(like(product_brands.name, `%${params.search}%`));
    }
    return and(...parts)!;
  }
}
