import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  and,
  asc,
  count,
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
import { carriers } from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import {
  fromBool,
  nowMysqlDateTime,
} from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../logistics-scope';
import {
  CarrierResponseDto,
  CreateCarrierDto,
  ListCarriersQueryDto,
  UpdateCarrierDto,
} from './dto/carrier.dto';
import { toCarrierResponse, type CarrierRow } from './carriers.mapper';

@Injectable()
export class CarriersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListCarriersQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<CarrierResponseDto>> {
    const { page, pageSize, organizationId, search, isActive } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      search,
      isActive,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(carriers).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(carriers)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(asc(carriers.name), asc(carriers.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as CarrierRow[]).map(toCarrierResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CarrierResponseDto> {
    const row = await this.requireCarrierAccess(id, currentOrganizationId, user);
    return toCarrierResponse(row);
  }

  async create(
    dto: CreateCarrierDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CarrierResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'carrier',
    );
    await ensureOrganizationExists(this.db, organizationId);

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(carriers).values({
        id,
        organization_id: organizationId,
        name: dto.name.trim(),
        code: dto.code?.trim() ? dto.code.trim().toUpperCase() : null,
        contact_email: dto.contactEmail ?? null,
        contact_phone: dto.contactPhone ?? null,
        tracking_url_template: dto.trackingUrlTemplate ?? null,
        is_active: fromBool(dto.isActive ?? true),
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid organization reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateCarrierDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CarrierResponseDto> {
    await this.requireCarrierAccess(id, currentOrganizationId, user);

    const patch: Partial<{
      name: string;
      code: string | null;
      contact_email: string | null;
      contact_phone: string | null;
      tracking_url_template: string | null;
      is_active: number;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.code !== undefined) {
      patch.code = dto.code?.trim() ? dto.code.trim().toUpperCase() : null;
    }
    if (dto.contactEmail !== undefined) patch.contact_email = dto.contactEmail;
    if (dto.contactPhone !== undefined) patch.contact_phone = dto.contactPhone;
    if (dto.trackingUrlTemplate !== undefined) {
      patch.tracking_url_template = dto.trackingUrlTemplate;
    }
    if (dto.isActive !== undefined) patch.is_active = fromBool(dto.isActive);

    await this.db.update(carriers).set(patch).where(eq(carriers.id, id));
    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireCarrierAccess(id, currentOrganizationId, user);
    await this.db
      .update(carriers)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(carriers.id, id));
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
    isActive?: boolean;
  }): SQL {
    const parts: SQL[] = [
      eq(carriers.organization_id, params.organizationId),
      isNull(carriers.deleted_at),
    ];
    if (params.isActive !== undefined) {
      parts.push(eq(carriers.is_active, fromBool(params.isActive)));
    }
    if (params.search?.trim()) {
      const term = `%${params.search.trim()}%`;
      parts.push(
        or(like(carriers.name, term), like(carriers.code, term))!,
      );
    }
    return and(...parts)!;
  }

  private async requireCarrierAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CarrierRow> {
    const [row] = await this.db
      .select()
      .from(carriers)
      .where(and(eq(carriers.id, id), isNull(carriers.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Carrier ${id} not found`);
    }
    assertOrgAccess(
      (row as CarrierRow).organization_id,
      currentOrganizationId,
      user,
      'carrier',
    );
    return row as CarrierRow;
  }
}
