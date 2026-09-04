import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { createId, type AuthUser } from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  procurement_approvals,
  procurement_quotes,
  procurement_requests,
} from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { assertOrgAccess } from '../procurement-scope';
import {
  PROCUREMENT_REQUEST_STATUS,
  type ProcurementRequestStatus,
} from '../procurement-requests/procurement-request-statuses';
import {
  CreateProcurementApprovalDto,
  ProcurementApprovalResponseDto,
} from './dto/procurement-approval.dto';
import {
  toProcurementApprovalResponse,
  type ProcurementApprovalRow,
} from './procurement-approvals.mapper';

type RequestScope = {
  id: string;
  organization_id: string;
  status: ProcurementRequestStatus;
};

@Injectable()
export class ProcurementApprovalsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async list(
    requestId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProcurementApprovalResponseDto[]> {
    await this.requireRequestInScope(
      requestId,
      currentOrganizationId,
      user,
    );
    const rows = await this.db
      .select()
      .from(procurement_approvals)
      .where(eq(procurement_approvals.procurement_request_id, requestId))
      .orderBy(
        desc(procurement_approvals.created_at),
        asc(procurement_approvals.id),
      );
    return (rows as ProcurementApprovalRow[]).map(
      toProcurementApprovalResponse,
    );
  }

  async create(
    requestId: string,
    dto: CreateProcurementApprovalDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProcurementApprovalResponseDto> {
    const request = await this.requireRequestInScope(
      requestId,
      currentOrganizationId,
      user,
    );

    if (
      dto.status === 'approved' ||
      dto.status === 'rejected'
    ) {
      if (request.status !== PROCUREMENT_REQUEST_STATUS.COMPARED) {
        throw new BadRequestException(
          'Request must be compared before approval or rejection',
        );
      }
    } else if (dto.status === 'pending') {
      if (
        request.status !== PROCUREMENT_REQUEST_STATUS.COMPARED &&
        request.status !== PROCUREMENT_REQUEST_STATUS.QUOTED
      ) {
        throw new BadRequestException(
          'Pending approval requires a quoted or compared request',
        );
      }
    }

    if (dto.procurementQuoteId) {
      await this.ensureQuoteOnRequest(requestId, dto.procurementQuoteId);
    }

    const now = nowMysqlDateTime();
    const isDecision = dto.status === 'approved' || dto.status === 'rejected';
    const id = createId();

    try {
      await this.db.insert(procurement_approvals).values({
        id,
        procurement_request_id: requestId,
        procurement_quote_id: dto.procurementQuoteId ?? null,
        approver_id: isDecision ? (user?.id ?? null) : null,
        status: dto.status,
        decision_at: isDecision ? now : null,
        comments: dto.comments ?? null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid procurement quote reference');
    }

    if (dto.status === 'approved') {
      await this.db
        .update(procurement_requests)
        .set({
          status: PROCUREMENT_REQUEST_STATUS.APPROVED,
          updated_at: now,
          updated_by: user?.id ?? null,
        })
        .where(eq(procurement_requests.id, requestId));
      // Intentionally does NOT create a purchase_order (Phase 10).
    }

    return this.requireRow(requestId, id);
  }

  private async ensureQuoteOnRequest(
    requestId: string,
    quoteId: string,
  ): Promise<void> {
    const [quote] = await this.db
      .select({
        id: procurement_quotes.id,
        procurement_request_id: procurement_quotes.procurement_request_id,
      })
      .from(procurement_quotes)
      .where(eq(procurement_quotes.id, quoteId))
      .limit(1);
    if (!quote || quote.procurement_request_id !== requestId) {
      throw new BadRequestException(
        'procurementQuoteId must belong to this procurement request',
      );
    }
  }

  private async requireRow(
    requestId: string,
    approvalId: string,
  ): Promise<ProcurementApprovalResponseDto> {
    const [row] = await this.db
      .select()
      .from(procurement_approvals)
      .where(
        and(
          eq(procurement_approvals.id, approvalId),
          eq(procurement_approvals.procurement_request_id, requestId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Procurement approval ${approvalId} not found`,
      );
    }
    return toProcurementApprovalResponse(row as ProcurementApprovalRow);
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
}
