import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { createId, type AuthUser } from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  product_services,
  products,
  services,
} from '../../../database/schema';
import { isMysqlDuplicateError } from '../../settings/utils/mysql-errors';
import {
  fromBool,
  nowMysqlDateTime,
} from '../../settings/utils/mysql-datetime';
import { assertOrgAccess } from '../catalogue-scope';
import {
  CreateProductServiceLinkDto,
  ProductServiceLinkResponseDto,
  UpdateProductServiceLinkDto,
} from './dto/product-service-link.dto';
import {
  toProductServiceLinkResponse,
  type ProductServiceLinkRow,
} from './product-services.mapper';

@Injectable()
export class ProductServicesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listByProduct(
    productId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductServiceLinkResponseDto[]> {
    await this.requireProductAccess(productId, currentOrganizationId, user);
    const rows = await this.loadLinks(productId);
    return rows.map(toProductServiceLinkResponse);
  }

  async create(
    productId: string,
    dto: CreateProductServiceLinkDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductServiceLinkResponseDto> {
    const product = await this.requireProductAccess(
      productId,
      currentOrganizationId,
      user,
    );
    await this.assertServiceInOrg(dto.serviceId, product.organization_id);

    const id = createId();
    try {
      await this.db.insert(product_services).values({
        id,
        product_id: productId,
        service_id: dto.serviceId,
        is_required: fromBool(dto.isRequired ?? false),
        default_quantity: dto.defaultQuantity ?? '1.0000',
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throw new ConflictException(
          'Service is already linked to this product',
        );
      }
      throw error;
    }

    return this.findOne(productId, id);
  }

  async update(
    productId: string,
    linkId: string,
    dto: UpdateProductServiceLinkDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProductServiceLinkResponseDto> {
    await this.requireProductAccess(productId, currentOrganizationId, user);
    await this.findLinkRow(productId, linkId);

    const patch: Partial<{
      is_required: number;
      default_quantity: string;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.isRequired !== undefined)
      patch.is_required = fromBool(dto.isRequired);
    if (dto.defaultQuantity !== undefined)
      patch.default_quantity = dto.defaultQuantity;

    await this.db
      .update(product_services)
      .set(patch)
      .where(eq(product_services.id, linkId));

    return this.findOne(productId, linkId);
  }

  async remove(
    productId: string,
    linkId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireProductAccess(productId, currentOrganizationId, user);
    await this.findLinkRow(productId, linkId);
    await this.db
      .delete(product_services)
      .where(eq(product_services.id, linkId));
  }

  private async findOne(
    productId: string,
    linkId: string,
  ): Promise<ProductServiceLinkResponseDto> {
    const row = await this.findLinkRow(productId, linkId);
    return toProductServiceLinkResponse(row);
  }

  private async loadLinks(
    productId: string,
  ): Promise<ProductServiceLinkRow[]> {
    const rows = await this.db
      .select({
        id: product_services.id,
        product_id: product_services.product_id,
        service_id: product_services.service_id,
        is_required: product_services.is_required,
        default_quantity: product_services.default_quantity,
        created_at: product_services.created_at,
        updated_at: product_services.updated_at,
        service_code: services.code,
        service_name: services.name,
      })
      .from(product_services)
      .innerJoin(services, eq(product_services.service_id, services.id))
      .where(
        and(
          eq(product_services.product_id, productId),
          isNull(services.deleted_at),
        ),
      )
      .orderBy(asc(services.code));

    return rows as ProductServiceLinkRow[];
  }

  private async findLinkRow(
    productId: string,
    linkId: string,
  ): Promise<ProductServiceLinkRow> {
    const [row] = await this.db
      .select({
        id: product_services.id,
        product_id: product_services.product_id,
        service_id: product_services.service_id,
        is_required: product_services.is_required,
        default_quantity: product_services.default_quantity,
        created_at: product_services.created_at,
        updated_at: product_services.updated_at,
        service_code: services.code,
        service_name: services.name,
      })
      .from(product_services)
      .innerJoin(services, eq(product_services.service_id, services.id))
      .where(
        and(
          eq(product_services.id, linkId),
          eq(product_services.product_id, productId),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Product–service link ${linkId} not found`);
    }
    return row as ProductServiceLinkRow;
  }

  private async requireProductAccess(
    productId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<{ id: string; organization_id: string }> {
    const [row] = await this.db
      .select({
        id: products.id,
        organization_id: products.organization_id,
      })
      .from(products)
      .where(and(eq(products.id, productId), isNull(products.deleted_at)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'product',
    );
    return row;
  }

  private async assertServiceInOrg(
    serviceId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: services.id,
        organization_id: services.organization_id,
      })
      .from(services)
      .where(and(eq(services.id, serviceId), isNull(services.deleted_at)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Service ${serviceId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'serviceId must belong to the same organization as the product',
      );
    }
  }
}
