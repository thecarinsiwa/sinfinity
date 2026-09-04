import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  count,
  desc,
  eq,
  gte,
  isNull,
  like,
  lte,
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
  activity_types,
  customers,
  leads,
  opportunities,
  sales_activities,
} from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../crm-scope';
import {
  CreateSalesActivityDto,
  type SalesActivityRelatedType,
} from './dto/create-sales-activity.dto';
import { ListSalesActivitiesQueryDto } from './dto/list-sales-activities-query.dto';
import { SalesActivityResponseDto } from './dto/sales-activity-response.dto';
import { UpdateSalesActivityDto } from './dto/update-sales-activity.dto';
import {
  toMysqlDateTime,
  toSalesActivityResponse,
  type SalesActivityRow,
} from './sales-activities.mapper';

@Injectable()
export class SalesActivitiesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListSalesActivitiesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<SalesActivityResponseDto>> {
    const {
      page,
      pageSize,
      search,
      organizationId,
      relatedType,
      relatedId,
      activityTypeId,
      userId,
      scheduledAtFrom,
      scheduledAtTo,
    } = query;

    if (
      (relatedType != null && relatedId == null) ||
      (relatedType == null && relatedId != null)
    ) {
      throw new BadRequestException(
        'relatedType and relatedId must be provided together',
      );
    }

    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      search,
      relatedType,
      relatedId,
      activityTypeId,
      userId,
      scheduledAtFrom,
      scheduledAtTo,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(sales_activities).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(sales_activities)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(
          desc(sales_activities.scheduled_at),
          desc(sales_activities.created_at),
        )
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as SalesActivityRow[]).map(toSalesActivityResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesActivityResponseDto> {
    const row = await this.requireActivityAccess(
      id,
      currentOrganizationId,
      user,
    );
    return toSalesActivityResponse(row);
  }

  async create(
    dto: CreateSalesActivityDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesActivityResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'sales activity',
    );
    await ensureOrganizationExists(this.db, organizationId);
    this.assertRelatedPair(dto.relatedType, dto.relatedId);
    await this.ensureActivityTypeExists(dto.activityTypeId);
    await this.ensureRelatedExists(
      dto.relatedType,
      dto.relatedId,
      organizationId,
    );

    const id = createId();
    try {
      await this.db.insert(sales_activities).values({
        id,
        organization_id: organizationId,
        activity_type_id: dto.activityTypeId ?? null,
        subject: dto.subject.trim(),
        description: dto.description ?? null,
        related_type: dto.relatedType ?? null,
        related_id: dto.relatedId ?? null,
        user_id: dto.userId ?? user?.id ?? null,
        scheduled_at: toMysqlDateTime(dto.scheduledAt),
        completed_at: toMysqlDateTime(dto.completedAt),
        outcome: dto.outcome ?? null,
      });
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid activity type or user reference',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateSalesActivityDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesActivityResponseDto> {
    const existing = await this.requireActivityAccess(
      id,
      currentOrganizationId,
      user,
    );

    if (dto.organizationId !== undefined) {
      assertOrgAccess(
        dto.organizationId,
        currentOrganizationId,
        user,
        'sales activity',
      );
      await ensureOrganizationExists(this.db, dto.organizationId);
    }

    const orgId = dto.organizationId ?? existing.organization_id;
    const relatedType =
      dto.relatedType !== undefined
        ? dto.relatedType
        : (existing.related_type as SalesActivityRelatedType | null);
    const relatedId =
      dto.relatedId !== undefined ? dto.relatedId : existing.related_id;

    if (dto.relatedType !== undefined || dto.relatedId !== undefined) {
      this.assertRelatedPair(relatedType, relatedId);
      await this.ensureRelatedExists(relatedType, relatedId, orgId);
    }

    if (dto.activityTypeId !== undefined) {
      await this.ensureActivityTypeExists(dto.activityTypeId);
    }

    const patch: Partial<{
      organization_id: string;
      activity_type_id: string | null;
      subject: string;
      description: string | null;
      related_type: string | null;
      related_id: string | null;
      user_id: string | null;
      scheduled_at: string | null;
      completed_at: string | null;
      outcome: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.organizationId !== undefined)
      patch.organization_id = dto.organizationId;
    if (dto.activityTypeId !== undefined)
      patch.activity_type_id = dto.activityTypeId;
    if (dto.subject !== undefined) patch.subject = dto.subject.trim();
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.relatedType !== undefined) patch.related_type = dto.relatedType;
    if (dto.relatedId !== undefined) patch.related_id = dto.relatedId;
    if (dto.userId !== undefined) patch.user_id = dto.userId;
    if (dto.scheduledAt !== undefined)
      patch.scheduled_at = toMysqlDateTime(dto.scheduledAt);
    if (dto.completedAt !== undefined)
      patch.completed_at = toMysqlDateTime(dto.completedAt);
    if (dto.outcome !== undefined) patch.outcome = dto.outcome;

    try {
      await this.db
        .update(sales_activities)
        .set(patch)
        .where(eq(sales_activities.id, id));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid activity type or user reference',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireActivityAccess(id, currentOrganizationId, user);
    await this.db
      .update(sales_activities)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(sales_activities.id, id));
  }

  private assertRelatedPair(
    relatedType: string | null | undefined,
    relatedId: string | null | undefined,
  ): void {
    const hasType = relatedType != null && relatedType !== '';
    const hasId = relatedId != null && relatedId !== '';
    if (hasType !== hasId) {
      throw new BadRequestException(
        'relatedType and relatedId must be provided together',
      );
    }
  }

  private async ensureActivityTypeExists(
    activityTypeId: string | null | undefined,
  ): Promise<void> {
    if (!activityTypeId) return;
    const [row] = await this.db
      .select({ id: activity_types.id })
      .from(activity_types)
      .where(eq(activity_types.id, activityTypeId))
      .limit(1);
    if (!row) {
      throw new BadRequestException(`Activity type ${activityTypeId} not found`);
    }
  }

  private async ensureRelatedExists(
    relatedType: string | null | undefined,
    relatedId: string | null | undefined,
    organizationId: string,
  ): Promise<void> {
    if (!relatedType || !relatedId) return;

    let found = false;
    if (relatedType === 'lead') {
      const [row] = await this.db
        .select({ id: leads.id })
        .from(leads)
        .where(
          and(
            eq(leads.id, relatedId),
            eq(leads.organization_id, organizationId),
            isNull(leads.deleted_at),
          ),
        )
        .limit(1);
      found = !!row;
    } else if (relatedType === 'customer') {
      const [row] = await this.db
        .select({ id: customers.id })
        .from(customers)
        .where(
          and(
            eq(customers.id, relatedId),
            eq(customers.organization_id, organizationId),
            isNull(customers.deleted_at),
          ),
        )
        .limit(1);
      found = !!row;
    } else if (relatedType === 'opportunity') {
      const [row] = await this.db
        .select({ id: opportunities.id })
        .from(opportunities)
        .where(
          and(
            eq(opportunities.id, relatedId),
            eq(opportunities.organization_id, organizationId),
            isNull(opportunities.deleted_at),
          ),
        )
        .limit(1);
      found = !!row;
    }

    if (!found) {
      throw new BadRequestException(
        `relatedId must reference an existing ${relatedType} in the organization`,
      );
    }
  }

  private async requireActivityAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesActivityRow> {
    const row = await this.findActiveRowById(id);
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'sales activity',
    );
    return row;
  }

  private async findActiveRowById(id: string): Promise<SalesActivityRow> {
    const [row] = await this.db
      .select()
      .from(sales_activities)
      .where(
        and(eq(sales_activities.id, id), isNull(sales_activities.deleted_at)),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Sales activity ${id} not found`);
    }
    return row as SalesActivityRow;
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
    relatedType?: string;
    relatedId?: string;
    activityTypeId?: string;
    userId?: string;
    scheduledAtFrom?: string;
    scheduledAtTo?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(sales_activities.organization_id, params.organizationId),
      isNull(sales_activities.deleted_at),
    ];
    if (params.search) {
      parts.push(like(sales_activities.subject, `%${params.search}%`));
    }
    if (params.relatedType) {
      parts.push(eq(sales_activities.related_type, params.relatedType));
    }
    if (params.relatedId) {
      parts.push(eq(sales_activities.related_id, params.relatedId));
    }
    if (params.activityTypeId) {
      parts.push(
        eq(sales_activities.activity_type_id, params.activityTypeId),
      );
    }
    if (params.userId) {
      parts.push(eq(sales_activities.user_id, params.userId));
    }
    if (params.scheduledAtFrom) {
      parts.push(
        gte(
          sales_activities.scheduled_at,
          toMysqlDateTime(params.scheduledAtFrom)!,
        ),
      );
    }
    if (params.scheduledAtTo) {
      parts.push(
        lte(
          sales_activities.scheduled_at,
          toMysqlDateTime(params.scheduledAtTo)!,
        ),
      );
    }
    return and(...parts)!;
  }
}
