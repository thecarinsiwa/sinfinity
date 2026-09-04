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
  products,
  supplier_products,
  suppliers,
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
  requireScopeOrgId,
} from '../suppliers-scope';
import { CreateSupplierProductDto } from './dto/create-supplier-product.dto';
import { ListSupplierProductsQueryDto } from './dto/list-supplier-products-query.dto';
import { SupplierProductResponseDto } from './dto/supplier-product-response.dto';
import { UpdateSupplierProductDto } from './dto/update-supplier-product.dto';
import {
  toSupplierProductResponse,
  type SupplierProductRow,
} from './supplier-products.mapper';

@Injectable()
export class SupplierProductsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListSupplierProductsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<SupplierProductResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      supplierId,
      productId,
      search,
      isAvailable,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      supplierId,
      productId,
      search,
      isAvailable,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db
      .select({
        id: supplier_products.id,
        supplier_id: supplier_products.supplier_id,
        product_id: supplier_products.product_id,
        supplier_sku: supplier_products.supplier_sku,
        unit_price: supplier_products.unit_price,
        currency_id: supplier_products.currency_id,
        moq: supplier_products.moq,
        lead_time_days: supplier_products.lead_time_days,
        is_available: supplier_products.is_available,
        created_at: supplier_products.created_at,
        updated_at: supplier_products.updated_at,
      })
      .from(supplier_products)
      .innerJoin(suppliers, eq(supplier_products.supplier_id, suppliers.id))
      .$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(supplier_products)
      .innerJoin(suppliers, eq(supplier_products.supplier_id, suppliers.id))
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(
          asc(supplier_products.supplier_id),
          asc(supplier_products.product_id),
        )
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as SupplierProductRow[]).map(toSupplierProductResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierProductResponseDto> {
    const row = await this.requireRowAccess(id, currentOrganizationId, user);
    return toSupplierProductResponse(row);
  }

  async create(
    dto: CreateSupplierProductDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierProductResponseDto> {
    const supplier = await this.requireSupplierInScope(
      dto.supplierId,
      currentOrganizationId,
      user,
    );
    await this.ensureProductInOrg(dto.productId, supplier.organization_id);

    const id = createId();
    try {
      await this.db.insert(supplier_products).values({
        id,
        supplier_id: dto.supplierId,
        product_id: dto.productId,
        supplier_sku: dto.supplierSku ?? null,
        unit_price: dto.unitPrice ?? '0.0000',
        currency_id: dto.currencyId ?? null,
        moq: dto.moq ?? null,
        lead_time_days: dto.leadTimeDays ?? null,
        is_available: fromBool(dto.isAvailable ?? true),
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Product is already linked to this supplier',
        );
      }
      throwFkOrRethrow(error, 'Invalid currency reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateSupplierProductDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierProductResponseDto> {
    await this.requireRowAccess(id, currentOrganizationId, user);

    const patch: Partial<{
      supplier_sku: string | null;
      unit_price: string;
      currency_id: string | null;
      moq: string | null;
      lead_time_days: number | null;
      is_available: number;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.supplierSku !== undefined) patch.supplier_sku = dto.supplierSku;
    if (dto.unitPrice !== undefined) patch.unit_price = dto.unitPrice;
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.moq !== undefined) patch.moq = dto.moq;
    if (dto.leadTimeDays !== undefined) patch.lead_time_days = dto.leadTimeDays;
    if (dto.isAvailable !== undefined)
      patch.is_available = fromBool(dto.isAvailable);

    try {
      await this.db
        .update(supplier_products)
        .set(patch)
        .where(eq(supplier_products.id, id));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid currency reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireRowAccess(id, currentOrganizationId, user);
    await this.db
      .delete(supplier_products)
      .where(eq(supplier_products.id, id));
  }

  private async requireRowAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierProductRow> {
    const [row] = await this.db
      .select({
        id: supplier_products.id,
        supplier_id: supplier_products.supplier_id,
        product_id: supplier_products.product_id,
        supplier_sku: supplier_products.supplier_sku,
        unit_price: supplier_products.unit_price,
        currency_id: supplier_products.currency_id,
        moq: supplier_products.moq,
        lead_time_days: supplier_products.lead_time_days,
        is_available: supplier_products.is_available,
        created_at: supplier_products.created_at,
        updated_at: supplier_products.updated_at,
        organization_id: suppliers.organization_id,
      })
      .from(supplier_products)
      .innerJoin(suppliers, eq(supplier_products.supplier_id, suppliers.id))
      .where(
        and(
          eq(supplier_products.id, id),
          isNull(suppliers.deleted_at),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Supplier product ${id} not found`);
    }

    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'supplier product',
    );

    const { organization_id: _org, ...productRow } = row;
    return productRow as SupplierProductRow;
  }

  private async requireSupplierInScope(
    supplierId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<{ id: string; organization_id: string }> {
    const [row] = await this.db
      .select({
        id: suppliers.id,
        organization_id: suppliers.organization_id,
      })
      .from(suppliers)
      .where(and(eq(suppliers.id, supplierId), isNull(suppliers.deleted_at)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'supplier',
    );
    return row;
  }

  private async ensureProductInOrg(
    productId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.id, productId),
          eq(products.organization_id, organizationId),
          isNull(products.deleted_at),
        ),
      )
      .limit(1);

    if (!row) {
      throw new BadRequestException(
        'productId must belong to the same organization as the supplier',
      );
    }
  }

  private buildWhere(params: {
    organizationId: string;
    supplierId?: string;
    productId?: string;
    search?: string;
    isAvailable?: boolean;
  }): SQL {
    const parts: SQL[] = [
      eq(suppliers.organization_id, params.organizationId),
      isNull(suppliers.deleted_at),
    ];
    if (params.supplierId) {
      parts.push(eq(supplier_products.supplier_id, params.supplierId));
    }
    if (params.productId) {
      parts.push(eq(supplier_products.product_id, params.productId));
    }
    if (params.search) {
      parts.push(like(supplier_products.supplier_sku, `%${params.search}%`));
    }
    if (params.isAvailable !== undefined) {
      parts.push(
        eq(supplier_products.is_available, fromBool(params.isAvailable)),
      );
    }
    return and(...parts)!;
  }
}
