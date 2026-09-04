import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
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
  product_brands,
  product_categories,
  product_images,
  product_models,
  product_specifications,
  product_subcategories,
  product_units,
  products,
} from '../../../database/schema';
import {
  isMysqlDuplicateError,
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
} from '../catalogue-scope';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import {
  CreateProductImageDto,
  CreateProductSpecificationDto,
  ProductImageResponseDto,
  ProductSpecificationResponseDto,
  UpdateProductImageDto,
  UpdateProductSpecificationDto,
} from './dto/product-nested.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  toProductImageResponse,
  toProductResponse,
  toProductSpecificationResponse,
  type ProductImageRow,
  type ProductRow,
  type ProductSpecificationRow,
} from './products.mapper';

@Injectable()
export class ProductsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListProductsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const {
      page,
      pageSize,
      search,
      categoryId,
      subcategoryId,
      brandId,
      isActive,
      isSerialized,
      organizationId,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      search,
      categoryId,
      subcategoryId,
      brandId,
      isActive,
      isSerialized,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(products).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(products)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(products.created_at))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as ProductRow[]).map((row) => toProductResponse(row)),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductResponseDto> {
    const row = await this.findActiveRowById(id);
    assertOrgAccess(row.organization_id, currentOrganizationId, user, 'product');
    const [specifications, images] = await Promise.all([
      this.loadSpecifications(id),
      this.loadImages(id),
    ]);
    return toProductResponse(row, { specifications, images });
  }

  async create(
    dto: CreateProductDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'product',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.assertTaxonomyRefs(dto, organizationId);

    const id = createId();
    try {
      await this.db.insert(products).values({
        id,
        organization_id: organizationId,
        sku: dto.sku.trim().toUpperCase(),
        name: dto.name.trim(),
        description: dto.description ?? null,
        category_id: dto.categoryId ?? null,
        subcategory_id: dto.subcategoryId ?? null,
        brand_id: dto.brandId ?? null,
        model_id: dto.modelId ?? null,
        unit_id: dto.unitId ?? null,
        base_price: dto.basePrice ?? '0.0000',
        cost_price: dto.costPrice ?? null,
        currency_id: dto.currencyId ?? null,
        is_serialized: fromBool(dto.isSerialized ?? false),
        is_active: fromBool(dto.isActive ?? true),
        created_by: user?.id ?? null,
        updated_by: user?.id ?? null,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throw new ConflictException(
          'SKU already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid catalog or currency reference');
    }

    if (dto.specifications?.length) {
      for (const spec of dto.specifications) {
        await this.insertSpecification(id, spec);
      }
    }
    if (dto.images?.length) {
      let primaryAssigned = false;
      for (const image of dto.images) {
        const makePrimary = image.isPrimary === true && !primaryAssigned;
        if (makePrimary) primaryAssigned = true;
        await this.insertImage(id, {
          ...image,
          isPrimary: makePrimary,
        });
      }
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductResponseDto> {
    const existing = await this.findActiveRowById(id);
    assertOrgAccess(
      existing.organization_id,
      currentOrganizationId,
      user,
      'product',
    );

    if (dto.organizationId !== undefined) {
      assertOrgAccess(
        dto.organizationId,
        currentOrganizationId,
        user,
        'product',
      );
      await ensureOrganizationExists(this.db, dto.organizationId);
    }

    const orgId = dto.organizationId ?? existing.organization_id;
    await this.assertTaxonomyRefs(
      {
        categoryId:
          dto.categoryId !== undefined ? dto.categoryId : existing.category_id,
        subcategoryId:
          dto.subcategoryId !== undefined
            ? dto.subcategoryId
            : existing.subcategory_id,
        brandId: dto.brandId !== undefined ? dto.brandId : existing.brand_id,
        modelId: dto.modelId !== undefined ? dto.modelId : existing.model_id,
        unitId: dto.unitId !== undefined ? dto.unitId : existing.unit_id,
        currencyId:
          dto.currencyId !== undefined ? dto.currencyId : existing.currency_id,
      },
      orgId,
    );

    const patch: Partial<{
      organization_id: string;
      sku: string;
      name: string;
      description: string | null;
      category_id: string | null;
      subcategory_id: string | null;
      brand_id: string | null;
      model_id: string | null;
      unit_id: string | null;
      base_price: string;
      cost_price: string | null;
      currency_id: string | null;
      is_serialized: number;
      is_active: number;
      updated_at: string;
      updated_by: string | null;
    }> = {
      updated_at: nowMysqlDateTime(),
      updated_by: user?.id ?? null,
    };

    if (dto.organizationId !== undefined)
      patch.organization_id = dto.organizationId;
    if (dto.sku !== undefined) patch.sku = dto.sku.trim().toUpperCase();
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.categoryId !== undefined) patch.category_id = dto.categoryId;
    if (dto.subcategoryId !== undefined)
      patch.subcategory_id = dto.subcategoryId;
    if (dto.brandId !== undefined) patch.brand_id = dto.brandId;
    if (dto.modelId !== undefined) patch.model_id = dto.modelId;
    if (dto.unitId !== undefined) patch.unit_id = dto.unitId;
    if (dto.basePrice !== undefined) patch.base_price = dto.basePrice;
    if (dto.costPrice !== undefined) patch.cost_price = dto.costPrice;
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.isSerialized !== undefined)
      patch.is_serialized = fromBool(dto.isSerialized);
    if (dto.isActive !== undefined) patch.is_active = fromBool(dto.isActive);

    try {
      await this.db.update(products).set(patch).where(eq(products.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throw new ConflictException(
          'SKU already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid catalog or currency reference');
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
      'product',
    );

    await this.db
      .update(products)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(products.id, id));
  }

  // --- Specifications ---

  async listSpecifications(
    productId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductSpecificationResponseDto[]> {
    await this.requireProductAccess(productId, currentOrganizationId, user);
    const rows = await this.loadSpecifications(productId);
    return rows.map(toProductSpecificationResponse);
  }

  async addSpecification(
    productId: string,
    dto: CreateProductSpecificationDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductSpecificationResponseDto> {
    await this.requireProductAccess(productId, currentOrganizationId, user);
    const id = await this.insertSpecification(productId, dto);
    return this.findSpecification(productId, id);
  }

  async updateSpecification(
    productId: string,
    specId: string,
    dto: UpdateProductSpecificationDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductSpecificationResponseDto> {
    await this.requireProductAccess(productId, currentOrganizationId, user);
    await this.findSpecificationRow(productId, specId);

    const patch: Partial<{
      spec_key: string;
      spec_value: string;
      unit: string | null;
      sort_order: number;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.specKey !== undefined) patch.spec_key = dto.specKey.trim();
    if (dto.specValue !== undefined) patch.spec_value = dto.specValue.trim();
    if (dto.unit !== undefined) patch.unit = dto.unit;
    if (dto.sortOrder !== undefined) patch.sort_order = dto.sortOrder;

    await this.db
      .update(product_specifications)
      .set(patch)
      .where(eq(product_specifications.id, specId));

    return this.findSpecification(productId, specId);
  }

  async removeSpecification(
    productId: string,
    specId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireProductAccess(productId, currentOrganizationId, user);
    await this.findSpecificationRow(productId, specId);
    await this.db
      .delete(product_specifications)
      .where(eq(product_specifications.id, specId));
  }

  // --- Images ---

  async listImages(
    productId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductImageResponseDto[]> {
    await this.requireProductAccess(productId, currentOrganizationId, user);
    const rows = await this.loadImages(productId);
    return rows.map(toProductImageResponse);
  }

  async addImage(
    productId: string,
    dto: CreateProductImageDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductImageResponseDto> {
    await this.requireProductAccess(productId, currentOrganizationId, user);
    if (dto.isPrimary) {
      await this.clearPrimaryImages(productId);
    }
    const id = await this.insertImage(productId, dto);
    return this.findImage(productId, id);
  }

  async updateImage(
    productId: string,
    imageId: string,
    dto: UpdateProductImageDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductImageResponseDto> {
    await this.requireProductAccess(productId, currentOrganizationId, user);
    await this.findImageRow(productId, imageId);

    if (dto.isPrimary === true) {
      await this.clearPrimaryImages(productId);
    }

    const patch: Partial<{
      url: string;
      alt_text: string | null;
      is_primary: number;
      sort_order: number;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.url !== undefined) patch.url = dto.url.trim();
    if (dto.altText !== undefined) patch.alt_text = dto.altText;
    if (dto.isPrimary !== undefined) patch.is_primary = fromBool(dto.isPrimary);
    if (dto.sortOrder !== undefined) patch.sort_order = dto.sortOrder;

    await this.db
      .update(product_images)
      .set(patch)
      .where(eq(product_images.id, imageId));

    return this.findImage(productId, imageId);
  }

  async removeImage(
    productId: string,
    imageId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireProductAccess(productId, currentOrganizationId, user);
    await this.findImageRow(productId, imageId);
    await this.db.delete(product_images).where(eq(product_images.id, imageId));
  }

  private async insertSpecification(
    productId: string,
    dto: CreateProductSpecificationDto,
  ): Promise<string> {
    const id = createId();
    await this.db.insert(product_specifications).values({
      id,
      product_id: productId,
      spec_key: dto.specKey.trim(),
      spec_value: dto.specValue.trim(),
      unit: dto.unit ?? null,
      sort_order: dto.sortOrder ?? 0,
    });
    return id;
  }

  private async insertImage(
    productId: string,
    dto: CreateProductImageDto,
  ): Promise<string> {
    const id = createId();
    await this.db.insert(product_images).values({
      id,
      product_id: productId,
      url: dto.url.trim(),
      alt_text: dto.altText ?? null,
      is_primary: fromBool(dto.isPrimary ?? false),
      sort_order: dto.sortOrder ?? 0,
    });
    return id;
  }

  private async clearPrimaryImages(productId: string): Promise<void> {
    await this.db
      .update(product_images)
      .set({ is_primary: 0, updated_at: nowMysqlDateTime() })
      .where(eq(product_images.product_id, productId));
  }

  private async loadSpecifications(
    productId: string,
  ): Promise<ProductSpecificationRow[]> {
    const rows = await this.db
      .select()
      .from(product_specifications)
      .where(eq(product_specifications.product_id, productId))
      .orderBy(
        asc(product_specifications.sort_order),
        asc(product_specifications.spec_key),
      );
    return rows as ProductSpecificationRow[];
  }

  private async loadImages(productId: string): Promise<ProductImageRow[]> {
    const rows = await this.db
      .select()
      .from(product_images)
      .where(eq(product_images.product_id, productId))
      .orderBy(
        desc(product_images.is_primary),
        asc(product_images.sort_order),
      );
    return rows as ProductImageRow[];
  }

  private async findSpecification(
    productId: string,
    specId: string,
  ): Promise<ProductSpecificationResponseDto> {
    const row = await this.findSpecificationRow(productId, specId);
    return toProductSpecificationResponse(row);
  }

  private async findSpecificationRow(
    productId: string,
    specId: string,
  ): Promise<ProductSpecificationRow> {
    const [row] = await this.db
      .select()
      .from(product_specifications)
      .where(
        and(
          eq(product_specifications.id, specId),
          eq(product_specifications.product_id, productId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Product specification ${specId} not found`);
    }
    return row as ProductSpecificationRow;
  }

  private async findImage(
    productId: string,
    imageId: string,
  ): Promise<ProductImageResponseDto> {
    const row = await this.findImageRow(productId, imageId);
    return toProductImageResponse(row);
  }

  private async findImageRow(
    productId: string,
    imageId: string,
  ): Promise<ProductImageRow> {
    const [row] = await this.db
      .select()
      .from(product_images)
      .where(
        and(
          eq(product_images.id, imageId),
          eq(product_images.product_id, productId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Product image ${imageId} not found`);
    }
    return row as ProductImageRow;
  }

  private async requireProductAccess(
    productId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductRow> {
    const row = await this.findActiveRowById(productId);
    assertOrgAccess(row.organization_id, currentOrganizationId, user, 'product');
    return row;
  }

  private async assertTaxonomyRefs(
    refs: {
      categoryId?: string | null;
      subcategoryId?: string | null;
      brandId?: string | null;
      modelId?: string | null;
      unitId?: string | null;
      currencyId?: string | null;
    },
    organizationId: string,
  ): Promise<void> {
    if (refs.categoryId) {
      const [cat] = await this.db
        .select({
          id: product_categories.id,
          organization_id: product_categories.organization_id,
        })
        .from(product_categories)
        .where(
          and(
            eq(product_categories.id, refs.categoryId),
            isNull(product_categories.deleted_at),
          ),
        )
        .limit(1);
      if (!cat || cat.organization_id !== organizationId) {
        throw new BadRequestException(
          'categoryId must belong to the same organization',
        );
      }
    }

    if (refs.subcategoryId) {
      const [sub] = await this.db
        .select({
          id: product_subcategories.id,
          category_id: product_subcategories.category_id,
          organization_id: product_categories.organization_id,
        })
        .from(product_subcategories)
        .innerJoin(
          product_categories,
          eq(product_subcategories.category_id, product_categories.id),
        )
        .where(
          and(
            eq(product_subcategories.id, refs.subcategoryId),
            isNull(product_subcategories.deleted_at),
            isNull(product_categories.deleted_at),
          ),
        )
        .limit(1);
      if (!sub || sub.organization_id !== organizationId) {
        throw new BadRequestException(
          'subcategoryId must belong to the same organization',
        );
      }
      if (refs.categoryId && sub.category_id !== refs.categoryId) {
        throw new BadRequestException(
          'subcategoryId must belong to categoryId',
        );
      }
    }

    if (refs.brandId) {
      const [brand] = await this.db
        .select({
          id: product_brands.id,
          organization_id: product_brands.organization_id,
        })
        .from(product_brands)
        .where(
          and(
            eq(product_brands.id, refs.brandId),
            isNull(product_brands.deleted_at),
          ),
        )
        .limit(1);
      if (!brand || brand.organization_id !== organizationId) {
        throw new BadRequestException(
          'brandId must belong to the same organization',
        );
      }
    }

    if (refs.modelId) {
      const [model] = await this.db
        .select({
          id: product_models.id,
          brand_id: product_models.brand_id,
          organization_id: product_brands.organization_id,
        })
        .from(product_models)
        .innerJoin(
          product_brands,
          eq(product_models.brand_id, product_brands.id),
        )
        .where(
          and(
            eq(product_models.id, refs.modelId),
            isNull(product_models.deleted_at),
            isNull(product_brands.deleted_at),
          ),
        )
        .limit(1);
      if (!model || model.organization_id !== organizationId) {
        throw new BadRequestException(
          'modelId must belong to the same organization',
        );
      }
      if (refs.brandId && model.brand_id !== refs.brandId) {
        throw new BadRequestException('modelId must belong to brandId');
      }
    }

    if (refs.unitId) {
      const [unit] = await this.db
        .select({ id: product_units.id })
        .from(product_units)
        .where(eq(product_units.id, refs.unitId))
        .limit(1);
      if (!unit) {
        throw new NotFoundException(`Product unit ${refs.unitId} not found`);
      }
    }
  }

  private async findActiveRowById(id: string): Promise<ProductRow> {
    const [row] = await this.db
      .select()
      .from(products)
      .where(and(eq(products.id, id), isNull(products.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return row as ProductRow;
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
    categoryId?: string;
    subcategoryId?: string;
    brandId?: string;
    isActive?: boolean;
    isSerialized?: boolean;
  }): SQL {
    const parts: SQL[] = [
      eq(products.organization_id, params.organizationId),
      isNull(products.deleted_at),
    ];
    if (params.categoryId) {
      parts.push(eq(products.category_id, params.categoryId));
    }
    if (params.subcategoryId) {
      parts.push(eq(products.subcategory_id, params.subcategoryId));
    }
    if (params.brandId) {
      parts.push(eq(products.brand_id, params.brandId));
    }
    if (params.isActive !== undefined) {
      parts.push(eq(products.is_active, fromBool(params.isActive)));
    }
    if (params.isSerialized !== undefined) {
      parts.push(eq(products.is_serialized, fromBool(params.isSerialized)));
    }
    if (params.search) {
      parts.push(
        or(
          like(products.sku, `%${params.search}%`),
          like(products.name, `%${params.search}%`),
        )!,
      );
    }
    return and(...parts)!;
  }
}
