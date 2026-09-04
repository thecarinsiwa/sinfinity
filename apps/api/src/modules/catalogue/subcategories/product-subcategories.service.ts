import {
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
import {
  product_categories,
  product_subcategories,
} from '../../../database/schema';
import { throwDuplicateOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  requireScopeOrgId,
} from '../catalogue-scope';
import { CreateProductSubcategoryDto } from './dto/create-product-subcategory.dto';
import { ListProductSubcategoriesQueryDto } from './dto/list-product-subcategories-query.dto';
import { ProductSubcategoryResponseDto } from './dto/product-subcategory-response.dto';
import { UpdateProductSubcategoryDto } from './dto/update-product-subcategory.dto';
import {
  toProductSubcategoryResponse,
  type ProductSubcategoryRow,
} from './product-subcategories.mapper';

@Injectable()
export class ProductSubcategoriesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListProductSubcategoriesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<ProductSubcategoryResponseDto>> {
    const { page, pageSize, search, categoryId, organizationId } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const offset = (page - 1) * pageSize;

    const where = this.buildWhere({
      organizationId: scopeOrgId,
      categoryId,
      search,
    });

    const listQuery = this.db
      .select({
        id: product_subcategories.id,
        category_id: product_subcategories.category_id,
        code: product_subcategories.code,
        name: product_subcategories.name,
        created_at: product_subcategories.created_at,
        updated_at: product_subcategories.updated_at,
        deleted_at: product_subcategories.deleted_at,
      })
      .from(product_subcategories)
      .innerJoin(
        product_categories,
        eq(product_subcategories.category_id, product_categories.id),
      )
      .$dynamic();

    const countQuery = this.db
      .select({ total: count() })
      .from(product_subcategories)
      .innerJoin(
        product_categories,
        eq(product_subcategories.category_id, product_categories.id),
      )
      .$dynamic();

    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(asc(product_subcategories.code))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as ProductSubcategoryRow[]).map(toProductSubcategoryResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductSubcategoryResponseDto> {
    const { row } = await this.findActiveWithOrg(id);
    assertOrgAccess(
      row.organizationId,
      currentOrganizationId,
      user,
      'subcategory',
    );
    return toProductSubcategoryResponse(row.sub);
  }

  async create(
    dto: CreateProductSubcategoryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductSubcategoryResponseDto> {
    const category = await this.requireCategoryInScope(
      dto.categoryId,
      currentOrganizationId,
      user,
    );

    const id = createId();
    try {
      await this.db.insert(product_subcategories).values({
        id,
        category_id: category.id,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
      });
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Subcategory code already exists for this category',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateProductSubcategoryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductSubcategoryResponseDto> {
    const { row } = await this.findActiveWithOrg(id);
    assertOrgAccess(
      row.organizationId,
      currentOrganizationId,
      user,
      'subcategory',
    );

    if (dto.categoryId !== undefined) {
      await this.requireCategoryInScope(
        dto.categoryId,
        currentOrganizationId,
        user,
      );
    }

    const patch: Partial<{
      category_id: string;
      code: string;
      name: string;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.categoryId !== undefined) patch.category_id = dto.categoryId;
    if (dto.code !== undefined) patch.code = dto.code.trim().toUpperCase();
    if (dto.name !== undefined) patch.name = dto.name.trim();

    try {
      await this.db
        .update(product_subcategories)
        .set(patch)
        .where(eq(product_subcategories.id, id));
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Subcategory code already exists for this category',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const { row } = await this.findActiveWithOrg(id);
    assertOrgAccess(
      row.organizationId,
      currentOrganizationId,
      user,
      'subcategory',
    );

    await this.db
      .update(product_subcategories)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(product_subcategories.id, id));
  }

  private async requireCategoryInScope(
    categoryId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<{ id: string; organization_id: string }> {
    const [cat] = await this.db
      .select({
        id: product_categories.id,
        organization_id: product_categories.organization_id,
      })
      .from(product_categories)
      .where(
        and(
          eq(product_categories.id, categoryId),
          isNull(product_categories.deleted_at),
        ),
      )
      .limit(1);

    if (!cat) {
      throw new NotFoundException(`Product category ${categoryId} not found`);
    }
    assertOrgAccess(
      cat.organization_id,
      currentOrganizationId,
      user,
      'category',
    );
    return cat;
  }

  private async findActiveWithOrg(id: string): Promise<{
    row: {
      sub: ProductSubcategoryRow;
      organizationId: string;
    };
  }> {
    const [joined] = await this.db
      .select({
        id: product_subcategories.id,
        category_id: product_subcategories.category_id,
        code: product_subcategories.code,
        name: product_subcategories.name,
        created_at: product_subcategories.created_at,
        updated_at: product_subcategories.updated_at,
        deleted_at: product_subcategories.deleted_at,
        organization_id: product_categories.organization_id,
      })
      .from(product_subcategories)
      .innerJoin(
        product_categories,
        eq(product_subcategories.category_id, product_categories.id),
      )
      .where(
        and(
          eq(product_subcategories.id, id),
          isNull(product_subcategories.deleted_at),
          isNull(product_categories.deleted_at),
        ),
      )
      .limit(1);

    if (!joined) {
      throw new NotFoundException(`Product subcategory ${id} not found`);
    }

    return {
      row: {
        organizationId: joined.organization_id,
        sub: {
          id: joined.id,
          category_id: joined.category_id,
          code: joined.code,
          name: joined.name,
          created_at: joined.created_at,
          updated_at: joined.updated_at,
          deleted_at: joined.deleted_at,
        },
      },
    };
  }

  private buildWhere(params: {
    organizationId: string;
    categoryId?: string;
    search?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(product_categories.organization_id, params.organizationId),
      isNull(product_categories.deleted_at),
      isNull(product_subcategories.deleted_at),
    ];
    if (params.categoryId) {
      parts.push(eq(product_subcategories.category_id, params.categoryId));
    }
    if (params.search) {
      parts.push(
        or(
          like(product_subcategories.code, `%${params.search}%`),
          like(product_subcategories.name, `%${params.search}%`),
        )!,
      );
    }
    return and(...parts)!;
  }
}
