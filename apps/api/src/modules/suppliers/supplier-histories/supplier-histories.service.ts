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
  currencies,
  supplier_histories,
  suppliers,
} from '../../../database/schema';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  requireScopeOrgId,
} from '../suppliers-scope';
import {
  CreateSupplierHistoryDto,
  ListSupplierHistoriesQueryDto,
  SupplierHistoryResponseDto,
} from './dto/supplier-history.dto';
import {
  toMysqlDateTime,
  toSupplierHistoryResponse,
  type SupplierHistoryRow,
} from './supplier-histories.mapper';

@Injectable()
export class SupplierHistoriesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListSupplierHistoriesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<SupplierHistoryResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      supplierId,
      eventType,
      occurredAtFrom,
      occurredAtTo,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      supplierId,
      eventType,
      occurredAtFrom,
      occurredAtTo,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db
      .select({
        id: supplier_histories.id,
        supplier_id: supplier_histories.supplier_id,
        event_type: supplier_histories.event_type,
        entity_type: supplier_histories.entity_type,
        entity_id: supplier_histories.entity_id,
        summary: supplier_histories.summary,
        amount: supplier_histories.amount,
        currency_id: supplier_histories.currency_id,
        occurred_at: supplier_histories.occurred_at,
      })
      .from(supplier_histories)
      .innerJoin(suppliers, eq(supplier_histories.supplier_id, suppliers.id))
      .$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(supplier_histories)
      .innerJoin(suppliers, eq(supplier_histories.supplier_id, suppliers.id))
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(
          desc(supplier_histories.occurred_at),
          desc(supplier_histories.id),
        )
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as SupplierHistoryRow[]).map(toSupplierHistoryResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async create(
    dto: CreateSupplierHistoryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierHistoryResponseDto> {
    await this.requireSupplierInScope(
      dto.supplierId,
      currentOrganizationId,
      user,
    );
    if (dto.currencyId) {
      await this.requireCurrency(dto.currencyId);
    }

    const id = createId();
    const occurredAt =
      toMysqlDateTime(dto.occurredAt) ?? nowMysqlDateTime();

    await this.db.insert(supplier_histories).values({
      id,
      supplier_id: dto.supplierId,
      event_type: dto.eventType,
      entity_type: dto.entityType ?? null,
      entity_id: dto.entityId ?? null,
      summary: dto.summary ?? null,
      amount: dto.amount ?? null,
      currency_id: dto.currencyId ?? null,
      occurred_at: occurredAt,
    });

    const [row] = await this.db
      .select({
        id: supplier_histories.id,
        supplier_id: supplier_histories.supplier_id,
        event_type: supplier_histories.event_type,
        entity_type: supplier_histories.entity_type,
        entity_id: supplier_histories.entity_id,
        summary: supplier_histories.summary,
        amount: supplier_histories.amount,
        currency_id: supplier_histories.currency_id,
        occurred_at: supplier_histories.occurred_at,
      })
      .from(supplier_histories)
      .where(eq(supplier_histories.id, id))
      .limit(1);

    return toSupplierHistoryResponse(row as SupplierHistoryRow);
  }

  private async requireSupplierInScope(
    supplierId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: suppliers.id,
        organization_id: suppliers.organization_id,
      })
      .from(suppliers)
      .where(and(eq(suppliers.id, supplierId), isNull(suppliers.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'supplier',
    );
  }

  private async requireCurrency(currencyId: string): Promise<void> {
    const [row] = await this.db
      .select({ id: currencies.id })
      .from(currencies)
      .where(eq(currencies.id, currencyId))
      .limit(1);
    if (!row) {
      throw new BadRequestException(`Currency ${currencyId} not found`);
    }
  }

  private buildWhere(params: {
    organizationId: string;
    supplierId?: string;
    eventType?: string;
    occurredAtFrom?: string;
    occurredAtTo?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(suppliers.organization_id, params.organizationId),
      isNull(suppliers.deleted_at),
    ];
    if (params.supplierId) {
      parts.push(eq(supplier_histories.supplier_id, params.supplierId));
    }
    if (params.eventType) {
      parts.push(eq(supplier_histories.event_type, params.eventType));
    }
    if (params.occurredAtFrom) {
      parts.push(
        gte(
          supplier_histories.occurred_at,
          toMysqlDateTime(params.occurredAtFrom)!,
        ),
      );
    }
    if (params.occurredAtTo) {
      parts.push(
        lte(
          supplier_histories.occurred_at,
          toMysqlDateTime(params.occurredAtTo)!,
        ),
      );
    }
    return and(...parts)!;
  }
}
