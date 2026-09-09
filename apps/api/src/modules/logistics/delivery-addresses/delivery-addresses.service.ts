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
  customers,
  delivery_addresses,
  warehouses,
} from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../logistics-scope';
import {
  CreateDeliveryAddressDto,
  DeliveryAddressResponseDto,
  ListDeliveryAddressesQueryDto,
  UpdateDeliveryAddressDto,
} from './dto/delivery-address.dto';
import {
  toDeliveryAddressResponse,
  type DeliveryAddressRow,
} from './delivery-addresses.mapper';

@Injectable()
export class DeliveryAddressesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListDeliveryAddressesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<DeliveryAddressResponseDto>> {
    const { page, pageSize, organizationId, search, customerId, warehouseId } =
      query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      search,
      customerId,
      warehouseId,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(delivery_addresses).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(delivery_addresses)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(delivery_addresses.created_at), asc(delivery_addresses.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as DeliveryAddressRow[]).map(toDeliveryAddressResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DeliveryAddressResponseDto> {
    const row = await this.requireAccess(id, currentOrganizationId, user);
    return toDeliveryAddressResponse(row);
  }

  async create(
    dto: CreateDeliveryAddressDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DeliveryAddressResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'delivery address',
    );
    await ensureOrganizationExists(this.db, organizationId);
    this.assertLinked(dto.customerId, dto.warehouseId);

    if (dto.customerId) {
      await this.ensureCustomerInOrg(dto.customerId, organizationId);
    }
    if (dto.warehouseId) {
      await this.ensureWarehouseInOrg(dto.warehouseId, organizationId);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(delivery_addresses).values({
        id,
        organization_id: organizationId,
        label: dto.label ?? null,
        line1: dto.line1.trim(),
        line2: dto.line2 ?? null,
        city_id: dto.cityId ?? null,
        country_id: dto.countryId ?? null,
        contact_name: dto.contactName ?? null,
        contact_phone: dto.contactPhone ?? null,
        customer_id: dto.customerId ?? null,
        warehouse_id: dto.warehouseId ?? null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid customer, warehouse, city or country reference',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateDeliveryAddressDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DeliveryAddressResponseDto> {
    const existing = await this.requireAccess(id, currentOrganizationId, user);

    const nextCustomerId =
      dto.customerId !== undefined ? dto.customerId : existing.customer_id;
    const nextWarehouseId =
      dto.warehouseId !== undefined ? dto.warehouseId : existing.warehouse_id;
    this.assertLinked(nextCustomerId, nextWarehouseId);

    if (nextCustomerId) {
      await this.ensureCustomerInOrg(
        nextCustomerId,
        existing.organization_id,
      );
    }
    if (nextWarehouseId) {
      await this.ensureWarehouseInOrg(
        nextWarehouseId,
        existing.organization_id,
      );
    }

    const patch: Record<string, unknown> = {
      updated_at: nowMysqlDateTime(),
    };
    if (dto.label !== undefined) patch.label = dto.label;
    if (dto.line1 !== undefined) patch.line1 = dto.line1.trim();
    if (dto.line2 !== undefined) patch.line2 = dto.line2;
    if (dto.cityId !== undefined) patch.city_id = dto.cityId;
    if (dto.countryId !== undefined) patch.country_id = dto.countryId;
    if (dto.contactName !== undefined) patch.contact_name = dto.contactName;
    if (dto.contactPhone !== undefined) patch.contact_phone = dto.contactPhone;
    if (dto.customerId !== undefined) patch.customer_id = dto.customerId;
    if (dto.warehouseId !== undefined) patch.warehouse_id = dto.warehouseId;

    try {
      await this.db
        .update(delivery_addresses)
        .set(patch)
        .where(eq(delivery_addresses.id, id));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid customer, warehouse, city or country reference',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireAccess(id, currentOrganizationId, user);
    await this.db
      .update(delivery_addresses)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(delivery_addresses.id, id));
  }

  private assertLinked(
    customerId: string | null | undefined,
    warehouseId: string | null | undefined,
  ): void {
    const hasCustomer = customerId != null && customerId !== '';
    const hasWarehouse = warehouseId != null && warehouseId !== '';
    if (!hasCustomer && !hasWarehouse) {
      throw new BadRequestException(
        'Delivery address requires at least one of customerId or warehouseId',
      );
    }
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
    customerId?: string;
    warehouseId?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(delivery_addresses.organization_id, params.organizationId),
      isNull(delivery_addresses.deleted_at),
    ];
    if (params.customerId) {
      parts.push(eq(delivery_addresses.customer_id, params.customerId));
    }
    if (params.warehouseId) {
      parts.push(eq(delivery_addresses.warehouse_id, params.warehouseId));
    }
    if (params.search?.trim()) {
      const term = `%${params.search.trim()}%`;
      parts.push(
        or(
          like(delivery_addresses.label, term),
          like(delivery_addresses.line1, term),
          like(delivery_addresses.contact_name, term),
        )!,
      );
    }
    return and(...parts)!;
  }

  private async requireAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<DeliveryAddressRow> {
    const [row] = await this.db
      .select()
      .from(delivery_addresses)
      .where(
        and(
          eq(delivery_addresses.id, id),
          isNull(delivery_addresses.deleted_at),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Delivery address ${id} not found`);
    }
    assertOrgAccess(
      (row as DeliveryAddressRow).organization_id,
      currentOrganizationId,
      user,
      'delivery address',
    );
    return row as DeliveryAddressRow;
  }

  private async ensureCustomerInOrg(
    customerId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: customers.id,
        organization_id: customers.organization_id,
        deleted_at: customers.deleted_at,
      })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Customer must belong to the same organization',
      );
    }
  }

  private async ensureWarehouseInOrg(
    warehouseId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: warehouses.id,
        organization_id: warehouses.organization_id,
        deleted_at: warehouses.deleted_at,
      })
      .from(warehouses)
      .where(eq(warehouses.id, warehouseId))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Warehouse ${warehouseId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Warehouse must belong to the same organization',
      );
    }
  }
}
