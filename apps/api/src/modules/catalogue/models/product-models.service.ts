import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, eq, isNull, like, ne, or, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { product_brands, product_models } from '../../../database/schema';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { assertOrgAccess, requireScopeOrgId } from '../catalogue-scope';
import { CreateProductModelDto } from './dto/create-product-model.dto';
import { ListProductModelsQueryDto } from './dto/list-product-models-query.dto';
import { ProductModelResponseDto } from './dto/product-model-response.dto';
import { UpdateProductModelDto } from './dto/update-product-model.dto';
import {
  toProductModelResponse,
  type ProductModelRow,
} from './product-models.mapper';

@Injectable()
export class ProductModelsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListProductModelsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<ProductModelResponseDto>> {
    const { page, pageSize, search, brandId, organizationId } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const offset = (page - 1) * pageSize;
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      brandId,
      search,
    });

    const listQuery = this.db
      .select({
        id: product_models.id,
        brand_id: product_models.brand_id,
        name: product_models.name,
        manufacturer_sku: product_models.manufacturer_sku,
        description: product_models.description,
        created_at: product_models.created_at,
        updated_at: product_models.updated_at,
        deleted_at: product_models.deleted_at,
      })
      .from(product_models)
      .innerJoin(
        product_brands,
        eq(product_models.brand_id, product_brands.id),
      )
      .$dynamic();

    const countQuery = this.db
      .select({ total: count() })
      .from(product_models)
      .innerJoin(
        product_brands,
        eq(product_models.brand_id, product_brands.id),
      )
      .$dynamic();

    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(asc(product_models.name))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as ProductModelRow[]).map(toProductModelResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductModelResponseDto> {
    const { model, organizationId } = await this.findActiveWithOrg(id);
    assertOrgAccess(organizationId, currentOrganizationId, user, 'model');
    return toProductModelResponse(model);
  }

  async create(
    dto: CreateProductModelDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductModelResponseDto> {
    await this.requireBrandInScope(
      dto.brandId,
      currentOrganizationId,
      user,
    );
    await this.assertUniqueManufacturerSku(
      dto.brandId,
      dto.manufacturerSku,
      undefined,
    );

    const id = createId();
    await this.db.insert(product_models).values({
      id,
      brand_id: dto.brandId,
      name: dto.name.trim(),
      manufacturer_sku: this.normalizeSku(dto.manufacturerSku),
      description: dto.description ?? null,
    });

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateProductModelDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductModelResponseDto> {
    const { model, organizationId } = await this.findActiveWithOrg(id);
    assertOrgAccess(organizationId, currentOrganizationId, user, 'model');

    const nextBrandId = dto.brandId ?? model.brand_id;
    if (dto.brandId !== undefined) {
      await this.requireBrandInScope(
        dto.brandId,
        currentOrganizationId,
        user,
      );
    }

    const nextSku =
      dto.manufacturerSku !== undefined
        ? dto.manufacturerSku
        : model.manufacturer_sku;
    await this.assertUniqueManufacturerSku(nextBrandId, nextSku, id);

    const patch: Partial<{
      brand_id: string;
      name: string;
      manufacturer_sku: string | null;
      description: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.brandId !== undefined) patch.brand_id = dto.brandId;
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.manufacturerSku !== undefined) {
      patch.manufacturer_sku = this.normalizeSku(dto.manufacturerSku);
    }
    if (dto.description !== undefined) patch.description = dto.description;

    await this.db
      .update(product_models)
      .set(patch)
      .where(eq(product_models.id, id));

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const { organizationId } = await this.findActiveWithOrg(id);
    assertOrgAccess(organizationId, currentOrganizationId, user, 'model');

    await this.db
      .update(product_models)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(product_models.id, id));
  }

  private normalizeSku(sku: string | null | undefined): string | null {
    if (sku === undefined || sku === null) {
      return null;
    }
    const trimmed = sku.trim();
    return trimmed.length ? trimmed : null;
  }

  private async assertUniqueManufacturerSku(
    brandId: string,
    sku: string | null | undefined,
    excludeId: string | undefined,
  ): Promise<void> {
    const normalized = this.normalizeSku(sku);
    if (!normalized) {
      return;
    }

    const parts: SQL[] = [
      eq(product_models.brand_id, brandId),
      eq(product_models.manufacturer_sku, normalized),
      isNull(product_models.deleted_at),
    ];
    if (excludeId) {
      parts.push(ne(product_models.id, excludeId));
    }

    const [existing] = await this.db
      .select({ id: product_models.id })
      .from(product_models)
      .where(and(...parts))
      .limit(1);

    if (existing) {
      throw new ConflictException(
        'manufacturerSku already exists for this brand',
      );
    }
  }

  private async requireBrandInScope(
    brandId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const [brand] = await this.db
      .select({
        id: product_brands.id,
        organization_id: product_brands.organization_id,
      })
      .from(product_brands)
      .where(
        and(eq(product_brands.id, brandId), isNull(product_brands.deleted_at)),
      )
      .limit(1);

    if (!brand) {
      throw new NotFoundException(`Product brand ${brandId} not found`);
    }
    assertOrgAccess(
      brand.organization_id,
      currentOrganizationId,
      user,
      'brand',
    );
  }

  private async findActiveWithOrg(id: string): Promise<{
    model: ProductModelRow;
    organizationId: string;
  }> {
    const [joined] = await this.db
      .select({
        id: product_models.id,
        brand_id: product_models.brand_id,
        name: product_models.name,
        manufacturer_sku: product_models.manufacturer_sku,
        description: product_models.description,
        created_at: product_models.created_at,
        updated_at: product_models.updated_at,
        deleted_at: product_models.deleted_at,
        organization_id: product_brands.organization_id,
      })
      .from(product_models)
      .innerJoin(
        product_brands,
        eq(product_models.brand_id, product_brands.id),
      )
      .where(
        and(
          eq(product_models.id, id),
          isNull(product_models.deleted_at),
          isNull(product_brands.deleted_at),
        ),
      )
      .limit(1);

    if (!joined) {
      throw new NotFoundException(`Product model ${id} not found`);
    }

    return {
      organizationId: joined.organization_id,
      model: {
        id: joined.id,
        brand_id: joined.brand_id,
        name: joined.name,
        manufacturer_sku: joined.manufacturer_sku,
        description: joined.description,
        created_at: joined.created_at,
        updated_at: joined.updated_at,
        deleted_at: joined.deleted_at,
      },
    };
  }

  private buildWhere(params: {
    organizationId: string;
    brandId?: string;
    search?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(product_brands.organization_id, params.organizationId),
      isNull(product_brands.deleted_at),
      isNull(product_models.deleted_at),
    ];
    if (params.brandId) {
      parts.push(eq(product_models.brand_id, params.brandId));
    }
    if (params.search) {
      parts.push(
        or(
          like(product_models.name, `%${params.search}%`),
          like(product_models.manufacturer_sku, `%${params.search}%`),
        )!,
      );
    }
    return and(...parts)!;
  }
}
