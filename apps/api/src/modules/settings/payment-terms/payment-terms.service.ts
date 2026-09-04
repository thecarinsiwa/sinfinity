import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, isNull, like, or, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { payment_terms } from '../../../database/schema';
import { nowMysqlDateTime } from '../utils/mysql-datetime';
import {
  toPaymentTermResponse,
  type PaymentTermRow,
} from './payment-terms.mapper';
import { CreatePaymentTermDto } from './dto/create-payment-term.dto';
import { ListPaymentTermsQueryDto } from './dto/list-payment-terms-query.dto';
import { PaymentTermResponseDto } from './dto/payment-term-response.dto';
import { UpdatePaymentTermDto } from './dto/update-payment-term.dto';

@Injectable()
export class PaymentTermsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListPaymentTermsQueryDto,
    currentOrganizationId?: string,
  ): Promise<PaginatedResponseDto<PaymentTermResponseDto>> {
    const { page, pageSize, search, globalOnly } = query;
    const where = this.buildWhere({
      search,
      globalOnly,
      currentOrganizationId,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(payment_terms).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(payment_terms)
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery.orderBy(payment_terms.code).limit(pageSize).offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as PaymentTermRow[]).map(toPaymentTermResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(id: string): Promise<PaymentTermResponseDto> {
    return toPaymentTermResponse(await this.findActiveRowById(id));
  }

  async create(
    dto: CreatePaymentTermDto,
    currentOrganizationId?: string,
  ): Promise<PaymentTermResponseDto> {
    const organizationId =
      dto.organizationId === undefined
        ? (currentOrganizationId ?? null)
        : dto.organizationId;

    const id = createId();

    await this.db.insert(payment_terms).values({
      id,
      organization_id: organizationId,
      code: dto.code.toUpperCase(),
      name: dto.name,
      days_due: dto.daysDue ?? 0,
      description: dto.description ?? null,
    });

    return this.findOne(id);
  }

  async update(
    id: string,
    dto: UpdatePaymentTermDto,
  ): Promise<PaymentTermResponseDto> {
    await this.findActiveRowById(id);

    const patch: Partial<{
      organization_id: string | null;
      code: string;
      name: string;
      days_due: number;
      description: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.organizationId !== undefined) {
      patch.organization_id = dto.organizationId;
    }
    if (dto.code !== undefined) patch.code = dto.code.toUpperCase();
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.daysDue !== undefined) patch.days_due = dto.daysDue;
    if (dto.description !== undefined) patch.description = dto.description;

    await this.db
      .update(payment_terms)
      .set(patch)
      .where(eq(payment_terms.id, id));

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findActiveRowById(id);
    await this.db
      .update(payment_terms)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(payment_terms.id, id));
  }

  private async findActiveRowById(id: string): Promise<PaymentTermRow> {
    const [row] = await this.db
      .select()
      .from(payment_terms)
      .where(and(eq(payment_terms.id, id), isNull(payment_terms.deleted_at)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Payment term ${id} not found`);
    }

    return row;
  }

  private buildWhere(params: {
    search?: string;
    globalOnly?: boolean;
    currentOrganizationId?: string;
  }): SQL | undefined {
    const parts: SQL[] = [isNull(payment_terms.deleted_at)];

    if (params.search) {
      parts.push(
        or(
          like(payment_terms.code, `%${params.search}%`),
          like(payment_terms.name, `%${params.search}%`),
        )!,
      );
    }

    if (params.globalOnly) {
      parts.push(isNull(payment_terms.organization_id));
    } else if (params.currentOrganizationId) {
      parts.push(
        or(
          isNull(payment_terms.organization_id),
          eq(payment_terms.organization_id, params.currentOrganizationId),
        )!,
      );
    }

    return and(...parts);
  }
}
