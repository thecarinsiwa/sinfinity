import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  count,
  desc,
  eq,
  isNull,
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
  supplier_evaluations,
  supplier_histories,
  suppliers,
} from '../../../database/schema';
import {
  nowMysqlDateTime,
  todayMysqlDate,
} from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  requireScopeOrgId,
} from '../suppliers-scope';
import {
  CreateSupplierEvaluationDto,
  ListSupplierEvaluationsQueryDto,
  SupplierEvaluationResponseDto,
  UpdateSupplierEvaluationDto,
} from './dto/supplier-evaluation.dto';
import {
  resolveOverallScore,
  toSupplierEvaluationResponse,
  type SupplierEvaluationRow,
} from './supplier-evaluations.mapper';

@Injectable()
export class SupplierEvaluationsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListSupplierEvaluationsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<SupplierEvaluationResponseDto>> {
    const { page, pageSize, organizationId, supplierId } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      supplierId,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db
      .select({
        id: supplier_evaluations.id,
        supplier_id: supplier_evaluations.supplier_id,
        evaluated_by: supplier_evaluations.evaluated_by,
        evaluated_at: supplier_evaluations.evaluated_at,
        quality_score: supplier_evaluations.quality_score,
        delivery_score: supplier_evaluations.delivery_score,
        price_score: supplier_evaluations.price_score,
        overall_score: supplier_evaluations.overall_score,
        comments: supplier_evaluations.comments,
        created_at: supplier_evaluations.created_at,
        updated_at: supplier_evaluations.updated_at,
      })
      .from(supplier_evaluations)
      .innerJoin(suppliers, eq(supplier_evaluations.supplier_id, suppliers.id))
      .$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(supplier_evaluations)
      .innerJoin(suppliers, eq(supplier_evaluations.supplier_id, suppliers.id))
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(
          desc(supplier_evaluations.evaluated_at),
          desc(supplier_evaluations.created_at),
        )
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as SupplierEvaluationRow[]).map(toSupplierEvaluationResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierEvaluationResponseDto> {
    const row = await this.requireRowAccess(id, currentOrganizationId, user);
    return toSupplierEvaluationResponse(row);
  }

  async create(
    dto: CreateSupplierEvaluationDto,
    updateSupplierRating: boolean,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierEvaluationResponseDto> {
    const supplier = await this.requireSupplierInScope(
      dto.supplierId,
      currentOrganizationId,
      user,
    );

    const overallScore = resolveOverallScore(
      dto.qualityScore,
      dto.deliveryScore,
      dto.priceScore,
      dto.overallScore,
    );
    const id = createId();
    await this.db.insert(supplier_evaluations).values({
      id,
      supplier_id: dto.supplierId,
      evaluated_by: user?.id ?? null,
      evaluated_at: (dto.evaluatedAt ?? todayMysqlDate()).slice(0, 10),
      quality_score: dto.qualityScore ?? null,
      delivery_score: dto.deliveryScore ?? null,
      price_score: dto.priceScore ?? null,
      overall_score: overallScore,
      comments: dto.comments ?? null,
    });

    if (updateSupplierRating && overallScore != null) {
      await this.applySupplierRating(
        supplier.id,
        overallScore,
        id,
        user?.id ?? null,
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateSupplierEvaluationDto,
    updateSupplierRating: boolean,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierEvaluationResponseDto> {
    const existing = await this.requireRowAccess(
      id,
      currentOrganizationId,
      user,
    );

    const qualityScore =
      dto.qualityScore !== undefined
        ? dto.qualityScore
        : existing.quality_score;
    const deliveryScore =
      dto.deliveryScore !== undefined
        ? dto.deliveryScore
        : existing.delivery_score;
    const priceScore =
      dto.priceScore !== undefined ? dto.priceScore : existing.price_score;
    const overallScore = resolveOverallScore(
      qualityScore,
      deliveryScore,
      priceScore,
      dto.overallScore !== undefined ? dto.overallScore : existing.overall_score,
    );

    const patch: Partial<{
      evaluated_at: string;
      quality_score: number | null;
      delivery_score: number | null;
      price_score: number | null;
      overall_score: string | null;
      comments: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.evaluatedAt !== undefined)
      patch.evaluated_at = dto.evaluatedAt.slice(0, 10);
    if (dto.qualityScore !== undefined) patch.quality_score = dto.qualityScore;
    if (dto.deliveryScore !== undefined)
      patch.delivery_score = dto.deliveryScore;
    if (dto.priceScore !== undefined) patch.price_score = dto.priceScore;
    if (
      dto.overallScore !== undefined ||
      dto.qualityScore !== undefined ||
      dto.deliveryScore !== undefined ||
      dto.priceScore !== undefined
    ) {
      patch.overall_score = overallScore;
    }
    if (dto.comments !== undefined) patch.comments = dto.comments;

    await this.db
      .update(supplier_evaluations)
      .set(patch)
      .where(eq(supplier_evaluations.id, id));

    if (updateSupplierRating && overallScore != null) {
      await this.applySupplierRating(
        existing.supplier_id,
        overallScore,
        id,
        user?.id ?? null,
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireRowAccess(id, currentOrganizationId, user);
    await this.db
      .delete(supplier_evaluations)
      .where(eq(supplier_evaluations.id, id));
  }

  private async applySupplierRating(
    supplierId: string,
    overallScore: string,
    evaluationId: string,
    userId: string | null,
  ): Promise<void> {
    await this.db
      .update(suppliers)
      .set({
        rating: overallScore,
        updated_at: nowMysqlDateTime(),
        updated_by: userId,
      })
      .where(eq(suppliers.id, supplierId));

    await this.db.insert(supplier_histories).values({
      id: createId(),
      supplier_id: supplierId,
      event_type: 'evaluation',
      entity_type: 'supplier_evaluation',
      entity_id: evaluationId,
      summary: `Rating updated to ${overallScore}`,
      occurred_at: nowMysqlDateTime(),
    });
  }

  private async requireRowAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierEvaluationRow> {
    const [row] = await this.db
      .select({
        id: supplier_evaluations.id,
        supplier_id: supplier_evaluations.supplier_id,
        evaluated_by: supplier_evaluations.evaluated_by,
        evaluated_at: supplier_evaluations.evaluated_at,
        quality_score: supplier_evaluations.quality_score,
        delivery_score: supplier_evaluations.delivery_score,
        price_score: supplier_evaluations.price_score,
        overall_score: supplier_evaluations.overall_score,
        comments: supplier_evaluations.comments,
        created_at: supplier_evaluations.created_at,
        updated_at: supplier_evaluations.updated_at,
        organization_id: suppliers.organization_id,
      })
      .from(supplier_evaluations)
      .innerJoin(suppliers, eq(supplier_evaluations.supplier_id, suppliers.id))
      .where(
        and(
          eq(supplier_evaluations.id, id),
          isNull(suppliers.deleted_at),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Supplier evaluation ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'supplier evaluation',
    );
    const { organization_id: _org, ...evaluation } = row;
    return evaluation as SupplierEvaluationRow;
  }

  private async requireSupplierInScope(
    supplierId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<{ id: string; organization_id: string }> {
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
    return row;
  }

  private buildWhere(params: {
    organizationId: string;
    supplierId?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(suppliers.organization_id, params.organizationId),
      isNull(suppliers.deleted_at),
    ];
    if (params.supplierId) {
      parts.push(eq(supplier_evaluations.supplier_id, params.supplierId));
    }
    return and(...parts)!;
  }
}
