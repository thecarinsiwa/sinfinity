import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, eq, isNull, like, or, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { product_categories } from '../../../database/schema';
import { throwDuplicateOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../catalogue-scope';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { ListProductCategoriesQueryDto } from './dto/list-product-categories-query.dto';
import {
  ProductCategoryResponseDto,
  ProductCategoryTreeNodeDto,
} from './dto/product-category-response.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import {
  buildCategoryTree,
  toProductCategoryResponse,
  type ProductCategoryRow,
} from './product-categories.mapper';

@Injectable()
export class ProductCategoriesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListProductCategoriesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<ProductCategoryResponseDto>> {
    const { page, pageSize, search, parentId, organizationId } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      search,
      parentId,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(product_categories).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(product_categories)
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(
          asc(product_categories.sort_order),
          asc(product_categories.code),
        )
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as ProductCategoryRow[]).map(toProductCategoryResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findTree(
    organizationIdQuery: string | undefined,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductCategoryTreeNodeDto[]> {
    const scopeOrgId = requireScopeOrgId(
      organizationIdQuery,
      currentOrganizationId,
      user,
    );
    const rows = await this.db
      .select()
      .from(product_categories)
      .where(
        and(
          eq(product_categories.organization_id, scopeOrgId),
          isNull(product_categories.deleted_at),
        ),
      );

    return buildCategoryTree(rows as ProductCategoryRow[]);
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductCategoryResponseDto> {
    const row = await this.findActiveRowById(id);
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'category',
    );
    return toProductCategoryResponse(row);
  }

  async create(
    dto: CreateProductCategoryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductCategoryResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'category',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.assertParent(dto.parentId, organizationId, undefined);

    const id = createId();
    try {
      await this.db.insert(product_categories).values({
        id,
        organization_id: organizationId,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        parent_id: dto.parentId ?? null,
        sort_order: dto.sortOrder ?? 0,
      });
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Category code already exists for this organization',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateProductCategoryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductCategoryResponseDto> {
    const existing = await this.findActiveRowById(id);
    assertOrgAccess(
      existing.organization_id,
      currentOrganizationId,
      user,
      'category',
    );

    if (dto.organizationId !== undefined) {
      assertOrgAccess(dto.organizationId, currentOrganizationId, user, 'category');
      await ensureOrganizationExists(this.db, dto.organizationId);
    }

    const orgId = dto.organizationId ?? existing.organization_id;
    if (dto.parentId !== undefined) {
      await this.assertParent(dto.parentId, orgId, id);
    }

    const patch: Partial<{
      organization_id: string;
      code: string;
      name: string;
      parent_id: string | null;
      sort_order: number;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.organizationId !== undefined)
      patch.organization_id = dto.organizationId;
    if (dto.code !== undefined) patch.code = dto.code.trim().toUpperCase();
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.parentId !== undefined) patch.parent_id = dto.parentId;
    if (dto.sortOrder !== undefined) patch.sort_order = dto.sortOrder;

    try {
      await this.db
        .update(product_categories)
        .set(patch)
        .where(eq(product_categories.id, id));
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Category code already exists for this organization',
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
      'category',
    );

    await this.db
      .update(product_categories)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(product_categories.id, id));
  }

  private async assertParent(
    parentId: string | null | undefined,
    organizationId: string,
    selfId: string | undefined,
  ): Promise<void> {
    if (!parentId) {
      return;
    }
    if (selfId && parentId === selfId) {
      throw new BadRequestException('Category cannot be its own parent');
    }
    const parent = await this.findActiveRowById(parentId);
    if (parent.organization_id !== organizationId) {
      throw new BadRequestException(
        'parentId must belong to the same organization',
      );
    }
    if (selfId) {
      this.assertNotDescendant(selfId, parentId, organizationId);
    }
  }

  /** Prevent cycles: parent must not already be under self. */
  private async assertNotDescendant(
    selfId: string,
    parentId: string,
    organizationId: string,
  ): Promise<void> {
    const rows = await this.db
      .select({ id: product_categories.id, parent_id: product_categories.parent_id })
      .from(product_categories)
      .where(
        and(
          eq(product_categories.organization_id, organizationId),
          isNull(product_categories.deleted_at),
        ),
      );

    const parentById = new Map(
      rows.map((r) => [r.id, r.parent_id as string | null]),
    );
    let cursor: string | null = parentId;
    const seen = new Set<string>();
    while (cursor) {
      if (cursor === selfId) {
        throw new BadRequestException(
          'parentId would create a cycle in the category tree',
        );
      }
      if (seen.has(cursor)) {
        break;
      }
      seen.add(cursor);
      cursor = parentById.get(cursor) ?? null;
    }
  }

  private async findActiveRowById(id: string): Promise<ProductCategoryRow> {
    const [row] = await this.db
      .select()
      .from(product_categories)
      .where(
        and(eq(product_categories.id, id), isNull(product_categories.deleted_at)),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Product category ${id} not found`);
    }
    return row as ProductCategoryRow;
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
    parentId?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(product_categories.organization_id, params.organizationId),
      isNull(product_categories.deleted_at),
    ];
    if (params.parentId) {
      parts.push(eq(product_categories.parent_id, params.parentId));
    }
    if (params.search) {
      parts.push(
        or(
          like(product_categories.code, `%${params.search}%`),
          like(product_categories.name, `%${params.search}%`),
        )!,
      );
    }
    return and(...parts)!;
  }
}
