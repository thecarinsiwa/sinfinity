import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, isNull, type SQL } from 'drizzle-orm';
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
  customers,
  invoices,
  refunds,
} from '../../../database/schema';
import { formatDecimal } from '../../sales-orders/sales-orders-totals';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../finances-scope';
import {
  INVOICE_STATUS,
  invoiceStatusFromPayments,
  type InvoiceStatus,
} from '../invoice-statuses';
import {
  assertRefundTransition,
  REFUND_STATUS,
} from '../refund-statuses';
import { AccountsLedgerService } from './accounts-ledger.service';
import {
  CreateRefundDto,
  ListRefundsQueryDto,
  RefundResponseDto,
  TransitionRefundDto,
  UpdateRefundDto,
} from './dto/refund.dto';
import { toRefundResponse, type RefundRow } from './refunds.mapper';

type Tx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];

@Injectable()
export class RefundsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly accountsLedger: AccountsLedgerService,
  ) {}

  async findAll(
    query: ListRefundsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<RefundResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      status,
      invoiceId,
      customerId,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [eq(refunds.organization_id, scopeOrgId)];
    if (status) parts.push(eq(refunds.status, status));
    if (invoiceId) parts.push(eq(refunds.invoice_id, invoiceId));
    if (customerId) parts.push(eq(refunds.customer_id, customerId));
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(refunds).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(refunds)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(refunds.created_at), asc(refunds.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as RefundRow[]).map(toRefundResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<RefundResponseDto> {
    const row = await this.requireRefundAccess(
      id,
      currentOrganizationId,
      user,
    );
    return toRefundResponse(row);
  }

  async create(
    dto: CreateRefundDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<RefundResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'refund',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureCustomerInOrg(dto.customerId, organizationId);
    await this.ensureInvoiceLinkable(
      dto.invoiceId,
      organizationId,
      dto.customerId,
    );
    if (dto.currencyId) {
      await this.ensureCurrencyExists(dto.currencyId);
    }

    const amount = formatDecimal(Number(dto.amount));
    if (Number(amount) <= 0) {
      throw new BadRequestException('amount must be greater than zero');
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(refunds).values({
        id,
        organization_id: organizationId,
        invoice_id: dto.invoiceId,
        customer_id: dto.customerId,
        amount,
        currency_id: dto.currencyId ?? null,
        reason: dto.reason ?? null,
        status: REFUND_STATUS.DRAFT,
        refunded_at: null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid refund reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateRefundDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<RefundResponseDto> {
    const existing = await this.requireRefundAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (existing.status !== REFUND_STATUS.DRAFT) {
      throw new BadRequestException(
        'Refund can only be updated while status is draft',
      );
    }
    if (dto.currencyId) {
      await this.ensureCurrencyExists(dto.currencyId);
    }

    const patch: Partial<{
      amount: string;
      currency_id: string | null;
      reason: string | null;
      updated_at: string;
    }> = {
      updated_at: nowMysqlDateTime(),
    };
    if (dto.amount !== undefined) {
      const amount = formatDecimal(Number(dto.amount));
      if (Number(amount) <= 0) {
        throw new BadRequestException('amount must be greater than zero');
      }
      patch.amount = amount;
    }
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.reason !== undefined) patch.reason = dto.reason;

    try {
      await this.db.update(refunds).set(patch).where(eq(refunds.id, id));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid refund reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const existing = await this.requireRefundAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (existing.status !== REFUND_STATUS.DRAFT) {
      throw new BadRequestException('Only draft refunds can be deleted');
    }
    await this.db.delete(refunds).where(eq(refunds.id, id));
  }

  async transition(
    id: string,
    dto: TransitionRefundDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<RefundResponseDto> {
    const existing = await this.requireRefundAccess(
      id,
      currentOrganizationId,
      user,
    );
    try {
      assertRefundTransition(existing.status, dto.toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    if (dto.toStatus === REFUND_STATUS.APPLIED) {
      await this.db.transaction(async (tx) => {
        await this.applyRefund(existing, tx);
        await tx
          .update(refunds)
          .set({
            status: REFUND_STATUS.APPLIED,
            refunded_at: nowMysqlDateTime(),
            updated_at: nowMysqlDateTime(),
          })
          .where(eq(refunds.id, id));
      });
    } else {
      await this.db
        .update(refunds)
        .set({
          status: dto.toStatus,
          updated_at: nowMysqlDateTime(),
        })
        .where(eq(refunds.id, id));
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  private async applyRefund(
    refund: RefundRow,
    db: DrizzleDB | Tx,
  ): Promise<void> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(
        and(eq(invoices.id, refund.invoice_id), isNull(invoices.deleted_at)),
      )
      .limit(1);
    if (!invoice) {
      throw new NotFoundException(`Invoice ${refund.invoice_id} not found`);
    }
    if (
      invoice.status === INVOICE_STATUS.DRAFT ||
      invoice.status === INVOICE_STATUS.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot apply refund to an invoice in status "${invoice.status}"`,
      );
    }

    const remaining =
      Number(invoice.total_amount) - Number(invoice.amount_paid);
    if (Number(refund.amount) > remaining + 1e-9) {
      throw new BadRequestException(
        `Refund amount exceeds invoice remaining balance (${formatDecimal(remaining)})`,
      );
    }

    const newTotal = formatDecimal(
      Number(invoice.total_amount) - Number(refund.amount),
    );
    if (Number(newTotal) < 0) {
      throw new BadRequestException('Refund would make invoice total negative');
    }

    const newStatus = invoiceStatusFromPayments(
      invoice.amount_paid,
      newTotal,
      invoice.status as InvoiceStatus,
    );

    await db
      .update(invoices)
      .set({
        total_amount: newTotal,
        status: newStatus,
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(invoices.id, invoice.id));

    await this.accountsLedger.upsertReceivable(
      {
        organizationId: invoice.organization_id,
        customerId: invoice.customer_id,
        invoiceId: invoice.id,
        originalAmount: newTotal,
        amountPaid: invoice.amount_paid,
        dueDate: invoice.due_date,
      },
      db,
    );
  }

  private async requireRefundAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<RefundRow> {
    const [row] = await this.db
      .select()
      .from(refunds)
      .where(eq(refunds.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Refund ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'refund',
    );
    return row as RefundRow;
  }

  private async ensureCustomerInOrg(
    customerId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: customers.id, organization_id: customers.organization_id })
      .from(customers)
      .where(and(eq(customers.id, customerId), isNull(customers.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Customer must belong to the same organization',
      );
    }
  }

  private async ensureInvoiceLinkable(
    invoiceId: string,
    organizationId: string,
    customerId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: invoices.id,
        organization_id: invoices.organization_id,
        customer_id: invoices.customer_id,
      })
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), isNull(invoices.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Invoice must belong to the same organization',
      );
    }
    if (row.customer_id !== customerId) {
      throw new BadRequestException(
        'Invoice customer must match the refund customer',
      );
    }
  }

  private async ensureCurrencyExists(currencyId: string): Promise<void> {
    const [row] = await this.db
      .select({ id: currencies.id })
      .from(currencies)
      .where(eq(currencies.id, currencyId))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Currency ${currencyId} not found`);
    }
  }
}
