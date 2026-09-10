import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, like, lte, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { login_logs } from '../../../database/schema';
import { ListLoginLogsQueryDto } from './dto/list-login-logs-query.dto';
import { LoginLogResponseDto } from './dto/login-log-response.dto';

type LoginLogRow = {
  id: string;
  user_id: string | null;
  email_attempted: string | null;
  success: number;
  failure_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

@Injectable()
export class LoginLogsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListLoginLogsQueryDto,
  ): Promise<PaginatedResponseDto<LoginLogResponseDto>> {
    const { page, pageSize, email, userId, success, dateFrom, dateTo } = query;
    const where = this.buildWhere({ email, userId, success, dateFrom, dateTo });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(login_logs).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(login_logs)
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(login_logs.created_at))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as LoginLogRow[]).map(this.toResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  private toResponse = (row: LoginLogRow): LoginLogResponseDto => ({
    id: row.id,
    userId: row.user_id,
    emailAttempted: row.email_attempted,
    success: row.success === 1,
    failureReason: row.failure_reason,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  });

  private buildWhere(params: {
    email?: string;
    userId?: string;
    success?: boolean;
    dateFrom?: string;
    dateTo?: string;
  }): SQL | undefined {
    const parts: SQL[] = [];

    if (params.email?.trim()) {
      parts.push(
        like(login_logs.email_attempted, `%${params.email.trim()}%`),
      );
    }
    if (params.userId) {
      parts.push(eq(login_logs.user_id, params.userId));
    }
    if (params.success !== undefined) {
      parts.push(eq(login_logs.success, params.success ? 1 : 0));
    }
    if (params.dateFrom) {
      parts.push(
        gte(login_logs.created_at, this.normalizeDateBound(params.dateFrom, false)),
      );
    }
    if (params.dateTo) {
      parts.push(
        lte(login_logs.created_at, this.normalizeDateBound(params.dateTo, true)),
      );
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
}
