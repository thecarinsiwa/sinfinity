import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, isNull, ne } from 'drizzle-orm';
import { createId, type AuthUser } from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  procurement_comparisons,
  procurement_quotes,
  procurement_requests,
} from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { assertOrgAccess } from '../procurement-scope';
import {
  PROCUREMENT_QUOTE_STATUS,
} from '../procurement-quotes/procurement-quote-statuses';
import {
  PROCUREMENT_REQUEST_STATUS,
  type ProcurementRequestStatus,
} from '../procurement-requests/procurement-request-statuses';
import {
  CreateProcurementComparisonDto,
  ProcurementComparisonResponseDto,
} from './dto/procurement-comparison.dto';
import {
  toProcurementComparisonResponse,
  type ProcurementComparisonRow,
} from './procurement-comparisons.mapper';

type RequestScope = {
  id: string;
  organization_id: string;
  status: ProcurementRequestStatus;
};

@Injectable()
export class ProcurementComparisonsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async list(
    requestId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProcurementComparisonResponseDto[]> {
    await this.requireRequestInScope(
      requestId,
      currentOrganizationId,
      user,
    );
    const rows = await this.db
      .select()
      .from(procurement_comparisons)
      .where(eq(procurement_comparisons.procurement_request_id, requestId))
      .orderBy(
        asc(procurement_comparisons.compared_at),
        asc(procurement_comparisons.id),
      );
    return (rows as ProcurementComparisonRow[]).map(
      toProcurementComparisonResponse,
    );
  }

  async create(
    requestId: string,
    dto: CreateProcurementComparisonDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProcurementComparisonResponseDto> {
    const request = await this.requireRequestInScope(
      requestId,
      currentOrganizationId,
      user,
    );
    this.assertComparable(request.status);

    if (dto.selectedQuoteId) {
      await this.selectQuote(requestId, dto.selectedQuoteId);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(procurement_comparisons).values({
        id,
        procurement_request_id: requestId,
        compared_by: user?.id ?? null,
        compared_at: now,
        criteria: dto.criteria ?? null,
        scores: dto.scores ?? null,
        selected_quote_id: dto.selectedQuoteId ?? null,
        recommendation: dto.recommendation ?? null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid selected quote reference');
    }

    if (request.status === PROCUREMENT_REQUEST_STATUS.QUOTED) {
      await this.db
        .update(procurement_requests)
        .set({
          status: PROCUREMENT_REQUEST_STATUS.COMPARED,
          updated_at: now,
          updated_by: user?.id ?? null,
        })
        .where(eq(procurement_requests.id, requestId));
    }

    return this.requireRow(requestId, id);
  }

  private async selectQuote(
    requestId: string,
    quoteId: string,
  ): Promise<void> {
    const [quote] = await this.db
      .select({
        id: procurement_quotes.id,
        status: procurement_quotes.status,
        procurement_request_id: procurement_quotes.procurement_request_id,
      })
      .from(procurement_quotes)
      .where(eq(procurement_quotes.id, quoteId))
      .limit(1);

    if (!quote || quote.procurement_request_id !== requestId) {
      throw new BadRequestException(
        'selectedQuoteId must belong to this procurement request',
      );
    }
    if (quote.status === PROCUREMENT_QUOTE_STATUS.REJECTED) {
      throw new BadRequestException('Cannot select a rejected quote');
    }

    const now = nowMysqlDateTime();
    await this.db
      .update(procurement_quotes)
      .set({
        status: PROCUREMENT_QUOTE_STATUS.SHORTLISTED,
        updated_at: now,
      })
      .where(
        and(
          eq(procurement_quotes.procurement_request_id, requestId),
          eq(procurement_quotes.status, PROCUREMENT_QUOTE_STATUS.SELECTED),
          ne(procurement_quotes.id, quoteId),
        ),
      );

    await this.db
      .update(procurement_quotes)
      .set({
        status: PROCUREMENT_QUOTE_STATUS.SELECTED,
        updated_at: now,
      })
      .where(eq(procurement_quotes.id, quoteId));
  }

  private async requireRow(
    requestId: string,
    comparisonId: string,
  ): Promise<ProcurementComparisonResponseDto> {
    const [row] = await this.db
      .select()
      .from(procurement_comparisons)
      .where(
        and(
          eq(procurement_comparisons.id, comparisonId),
          eq(procurement_comparisons.procurement_request_id, requestId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Procurement comparison ${comparisonId} not found`,
      );
    }
    return toProcurementComparisonResponse(row as ProcurementComparisonRow);
  }

  private async requireRequestInScope(
    requestId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<RequestScope> {
    const [row] = await this.db
      .select({
        id: procurement_requests.id,
        organization_id: procurement_requests.organization_id,
        status: procurement_requests.status,
      })
      .from(procurement_requests)
      .where(
        and(
          eq(procurement_requests.id, requestId),
          isNull(procurement_requests.deleted_at),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Procurement request ${requestId} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'procurement request',
    );
    return row as RequestScope;
  }

  private assertComparable(status: ProcurementRequestStatus): void {
    if (
      status !== PROCUREMENT_REQUEST_STATUS.QUOTED &&
      status !== PROCUREMENT_REQUEST_STATUS.COMPARED
    ) {
      throw new BadRequestException(
        'Comparisons can only be created while the request is quoted or compared',
      );
    }
  }
}
