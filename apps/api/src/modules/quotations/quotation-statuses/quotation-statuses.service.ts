import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, eq, like, or, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { quotation_statuses } from '../../../database/schema';
import { ListQuotationStatusesQueryDto } from './dto/list-quotation-statuses-query.dto';
import { QuotationStatusResponseDto } from './dto/quotation-status-response.dto';
import {
  toQuotationStatusResponse,
  type QuotationStatusRow,
} from './quotation-statuses.mapper';

@Injectable()
export class QuotationStatusesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListQuotationStatusesQueryDto,
  ): Promise<PaginatedResponseDto<QuotationStatusResponseDto>> {
    const { page, pageSize, search } = query;
    const where = this.buildWhere(search);
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(quotation_statuses).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(quotation_statuses)
      .$dynamic();
    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(asc(quotation_statuses.sort_order), asc(quotation_statuses.code))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as QuotationStatusRow[]).map(toQuotationStatusResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(id: string): Promise<QuotationStatusResponseDto> {
    const [row] = await this.db
      .select()
      .from(quotation_statuses)
      .where(eq(quotation_statuses.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Quotation status ${id} not found`);
    }
    return toQuotationStatusResponse(row as QuotationStatusRow);
  }

  async findIdByCode(code: string): Promise<string> {
    const [row] = await this.db
      .select({ id: quotation_statuses.id })
      .from(quotation_statuses)
      .where(eq(quotation_statuses.code, code))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Quotation status code ${code} not found`);
    }
    return row.id;
  }

  private buildWhere(search?: string): SQL | undefined {
    if (!search) return undefined;
    return or(
      like(quotation_statuses.code, `%${search}%`),
      like(quotation_statuses.name, `%${search}%`),
    )!;
  }
}
