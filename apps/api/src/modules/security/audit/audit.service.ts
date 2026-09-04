import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { and, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { audit_logs } from '../../../database/schema';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

export type WriteAuditLogInput = {
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string | null;
};

type AuditLogRow = {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: unknown;
  new_values: unknown;
  ip_address: string | null;
  created_at: string;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async write(input: WriteAuditLogInput): Promise<void> {
    try {
      await this.db.insert(audit_logs).values({
        id: createId(),
        organization_id: input.organizationId ?? null,
        user_id: input.userId ?? null,
        action: input.action.slice(0, 64),
        entity_type: input.entityType.slice(0, 64),
        entity_id: input.entityId ?? null,
        old_values: this.toJsonColumn(input.oldValues),
        new_values: this.toJsonColumn(input.newValues),
        ip_address: input.ipAddress ?? null,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to write audit log for ${input.action} ${input.entityType}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async findAll(
    query: ListAuditLogsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<AuditLogResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      entityType,
      entityId,
      userId,
      action,
      dateFrom,
      dateTo,
    } = query;

    const scopeOrgId = this.resolveScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );

    if (!user?.isSuperAdmin && !scopeOrgId) {
      throw new BadRequestException('organizationId is required');
    }

    const where = this.buildWhere({
      organizationId: scopeOrgId,
      entityType,
      entityId,
      userId,
      action,
      dateFrom,
      dateTo,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(audit_logs).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(audit_logs)
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(audit_logs.created_at))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as AuditLogRow[]).map(this.toResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  private toResponse = (row: AuditLogRow): AuditLogResponseDto => ({
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    oldValues: (row.old_values as AuditLogResponseDto['oldValues']) ?? null,
    newValues: (row.new_values as AuditLogResponseDto['newValues']) ?? null,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
  });

  private resolveScopeOrgId(
    queryOrgId: string | undefined,
    currentOrganizationId: string | undefined,
    user?: AuthUser,
  ): string | undefined {
    if (user?.isSuperAdmin) {
      return queryOrgId ?? currentOrganizationId;
    }
    const scope = currentOrganizationId ?? user?.organizationId ?? queryOrgId;
    if (
      user &&
      queryOrgId &&
      queryOrgId !== user.organizationId
    ) {
      throw new ForbiddenException(
        'Cannot read audit logs of another organization',
      );
    }
    return scope;
  }

  private buildWhere(params: {
    organizationId?: string;
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }): SQL | undefined {
    const parts: SQL[] = [];

    if (params.organizationId) {
      parts.push(eq(audit_logs.organization_id, params.organizationId));
    }
    if (params.entityType) {
      parts.push(eq(audit_logs.entity_type, params.entityType));
    }
    if (params.entityId) {
      parts.push(eq(audit_logs.entity_id, params.entityId));
    }
    if (params.userId) {
      parts.push(eq(audit_logs.user_id, params.userId));
    }
    if (params.action) {
      parts.push(eq(audit_logs.action, params.action));
    }
    if (params.dateFrom) {
      parts.push(gte(audit_logs.created_at, this.normalizeDateBound(params.dateFrom, false)));
    }
    if (params.dateTo) {
      parts.push(lte(audit_logs.created_at, this.normalizeDateBound(params.dateTo, true)));
    }

    return parts.length ? and(...parts) : undefined;
  }

  private normalizeDateBound(value: string, endOfDay: boolean): string {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return endOfDay
        ? `${trimmed} 23:59:59.999`
        : `${trimmed} 00:00:00.000`;
    }
    return trimmed.replace('T', ' ').replace('Z', '');
  }

  private toJsonColumn(value: unknown): unknown {
    if (value === undefined) {
      return null;
    }
    return value;
  }
}
