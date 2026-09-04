import {
  BadRequestException,
  ConflictException,
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
import { service_categories, services } from '../../../database/schema';
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
import { CreateServiceDto } from './dto/create-service.dto';
import { ListServicesQueryDto } from './dto/list-services-query.dto';
import {
  ServiceResponseDto,
  type ServiceBillingType,
} from './dto/service-response.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { toServiceResponse, type ServiceRow } from './services.mapper';

@Injectable()
export class ServicesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListServicesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<ServiceResponseDto>> {
    const {
      page,
      pageSize,
      search,
      categoryId,
      billingType,
      isActive,
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
      billingType,
      isActive,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(services).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(services)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery.orderBy(asc(services.code)).limit(pageSize).offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as ServiceRow[]).map(toServiceResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ServiceResponseDto> {
    const row = await this.findActiveRowById(id);
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'service',
    );
    return toServiceResponse(row);
  }

  async create(
    dto: CreateServiceDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ServiceResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'service',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.assertCategory(dto.categoryId, organizationId);

    const id = createId();
    try {
      await this.db.insert(services).values({
        id,
        organization_id: organizationId,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        description: dto.description ?? null,
        category_id: dto.categoryId ?? null,
        base_price: dto.basePrice ?? '0.0000',
        currency_id: dto.currencyId ?? null,
        billing_type: dto.billingType ?? 'fixed',
        is_active: fromBool(dto.isActive ?? true),
        created_by: user?.id ?? null,
        updated_by: user?.id ?? null,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throw new ConflictException(
          'Service code already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid category or currency reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateServiceDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ServiceResponseDto> {
    const existing = await this.findActiveRowById(id);
    assertOrgAccess(
      existing.organization_id,
      currentOrganizationId,
      user,
      'service',
    );

    if (dto.organizationId !== undefined) {
      assertOrgAccess(
        dto.organizationId,
        currentOrganizationId,
        user,
        'service',
      );
      await ensureOrganizationExists(this.db, dto.organizationId);
    }

    const orgId = dto.organizationId ?? existing.organization_id;
    if (dto.categoryId !== undefined) {
      await this.assertCategory(dto.categoryId, orgId);
    }

    const patch: Partial<{
      organization_id: string;
      code: string;
      name: string;
      description: string | null;
      category_id: string | null;
      base_price: string;
      currency_id: string | null;
      billing_type: ServiceBillingType;
      is_active: number;
      updated_at: string;
      updated_by: string | null;
    }> = {
      updated_at: nowMysqlDateTime(),
      updated_by: user?.id ?? null,
    };

    if (dto.organizationId !== undefined)
      patch.organization_id = dto.organizationId;
    if (dto.code !== undefined) patch.code = dto.code.trim().toUpperCase();
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.categoryId !== undefined) patch.category_id = dto.categoryId;
    if (dto.basePrice !== undefined) patch.base_price = dto.basePrice;
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.billingType !== undefined) patch.billing_type = dto.billingType;
    if (dto.isActive !== undefined) patch.is_active = fromBool(dto.isActive);

    try {
      await this.db.update(services).set(patch).where(eq(services.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throw new ConflictException(
          'Service code already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid category or currency reference');
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
      'service',
    );

    await this.db
      .update(services)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(services.id, id));
  }

  private async assertCategory(
    categoryId: string | null | undefined,
    organizationId: string,
  ): Promise<void> {
    if (!categoryId) {
      return;
    }
    const [row] = await this.db
      .select({
        id: service_categories.id,
        organization_id: service_categories.organization_id,
      })
      .from(service_categories)
      .where(
        and(
          eq(service_categories.id, categoryId),
          isNull(service_categories.deleted_at),
        ),
      )
      .limit(1);

    if (!row || row.organization_id !== organizationId) {
      throw new BadRequestException(
        'categoryId must belong to the same organization',
      );
    }
  }

  private async findActiveRowById(id: string): Promise<ServiceRow> {
    const [row] = await this.db
      .select()
      .from(services)
      .where(and(eq(services.id, id), isNull(services.deleted_at)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Service ${id} not found`);
    }
    return row as ServiceRow;
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
    categoryId?: string;
    billingType?: ServiceBillingType;
    isActive?: boolean;
  }): SQL {
    const parts: SQL[] = [
      eq(services.organization_id, params.organizationId),
      isNull(services.deleted_at),
    ];
    if (params.categoryId) {
      parts.push(eq(services.category_id, params.categoryId));
    }
    if (params.billingType) {
      parts.push(eq(services.billing_type, params.billingType));
    }
    if (params.isActive !== undefined) {
      parts.push(eq(services.is_active, fromBool(params.isActive)));
    }
    if (params.search) {
      parts.push(
        or(
          like(services.code, `%${params.search}%`),
          like(services.name, `%${params.search}%`),
        )!,
      );
    }
    return and(...parts)!;
  }
}
