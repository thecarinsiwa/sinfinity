import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, eq, isNull, like, or, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { lead_sources } from '../../../database/schema';
import { throwDuplicateOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../crm-scope';
import { CreateLeadSourceDto } from './dto/create-lead-source.dto';
import { LeadSourceResponseDto } from './dto/lead-source-response.dto';
import { ListLeadSourcesQueryDto } from './dto/list-lead-sources-query.dto';
import { UpdateLeadSourceDto } from './dto/update-lead-source.dto';
import {
  toLeadSourceResponse,
  type LeadSourceRow,
} from './lead-sources.mapper';

@Injectable()
export class LeadSourcesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListLeadSourcesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<LeadSourceResponseDto>> {
    const { page, pageSize, search, organizationId } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({ organizationId: scopeOrgId, search });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(lead_sources).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(lead_sources)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery.orderBy(asc(lead_sources.code)).limit(pageSize).offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as LeadSourceRow[]).map(toLeadSourceResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<LeadSourceResponseDto> {
    const row = await this.findActiveRowById(id);
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'lead source',
    );
    return toLeadSourceResponse(row);
  }

  async create(
    dto: CreateLeadSourceDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<LeadSourceResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'lead source',
    );
    await ensureOrganizationExists(this.db, organizationId);

    const id = createId();
    try {
      await this.db.insert(lead_sources).values({
        id,
        organization_id: organizationId,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
      });
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Lead source code already exists for this organization',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateLeadSourceDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<LeadSourceResponseDto> {
    const existing = await this.findActiveRowById(id);
    assertOrgAccess(
      existing.organization_id,
      currentOrganizationId,
      user,
      'lead source',
    );

    if (dto.organizationId !== undefined) {
      assertOrgAccess(
        dto.organizationId,
        currentOrganizationId,
        user,
        'lead source',
      );
      await ensureOrganizationExists(this.db, dto.organizationId);
    }

    const patch: Partial<{
      organization_id: string;
      code: string;
      name: string;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.organizationId !== undefined)
      patch.organization_id = dto.organizationId;
    if (dto.code !== undefined) patch.code = dto.code.trim().toUpperCase();
    if (dto.name !== undefined) patch.name = dto.name.trim();

    try {
      await this.db
        .update(lead_sources)
        .set(patch)
        .where(eq(lead_sources.id, id));
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Lead source code already exists for this organization',
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
      'lead source',
    );

    await this.db
      .update(lead_sources)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(lead_sources.id, id));
  }

  private async findActiveRowById(id: string): Promise<LeadSourceRow> {
    const [row] = await this.db
      .select()
      .from(lead_sources)
      .where(and(eq(lead_sources.id, id), isNull(lead_sources.deleted_at)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Lead source ${id} not found`);
    }
    return row as LeadSourceRow;
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(lead_sources.organization_id, params.organizationId),
      isNull(lead_sources.deleted_at),
    ];
    if (params.search) {
      parts.push(
        or(
          like(lead_sources.code, `%${params.search}%`),
          like(lead_sources.name, `%${params.search}%`),
        )!,
      );
    }
    return and(...parts)!;
  }
}
