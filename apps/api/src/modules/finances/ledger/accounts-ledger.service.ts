import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { createId } from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { accounts_receivable } from '../../../database/schema';
import { formatDecimal } from '../../sales-orders/sales-orders-totals';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { computeAgingBucket } from '../aging-buckets';
import { AR_STATUS, type ArStatus } from '../ar-statuses';

type Tx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];

export type UpsertArInput = {
  organizationId: string;
  customerId: string;
  invoiceId: string;
  originalAmount: string;
  amountPaid?: string;
  dueDate?: string | null;
};

function arStatusFromBalance(
  balanceDue: number,
  originalAmount: number,
): ArStatus {
  if (balanceDue <= 1e-9) return AR_STATUS.CLOSED;
  if (balanceDue + 1e-9 < originalAmount) return AR_STATUS.PARTIAL;
  return AR_STATUS.OPEN;
}

/**
 * Internal AR upserts (issue invoice, confirm payment). No free CRUD.
 */
@Injectable()
export class AccountsLedgerService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async upsertReceivable(
    input: UpsertArInput,
    db: DrizzleDB | Tx = this.db,
  ): Promise<void> {
    const original = Number(input.originalAmount);
    const paid = Number(input.amountPaid ?? '0');
    const balance = Math.max(0, original - paid);
    const balanceDue = formatDecimal(balance);
    const originalAmount = formatDecimal(original);
    const dueDate =
      input.dueDate == null ? null : input.dueDate.slice(0, 10);
    const agingBucket = computeAgingBucket(dueDate);
    const status = arStatusFromBalance(balance, original);
    const now = nowMysqlDateTime();

    const [existing] = await db
      .select({ id: accounts_receivable.id })
      .from(accounts_receivable)
      .where(eq(accounts_receivable.invoice_id, input.invoiceId))
      .limit(1);

    if (existing) {
      await db
        .update(accounts_receivable)
        .set({
          customer_id: input.customerId,
          original_amount: originalAmount,
          balance_due: balanceDue,
          due_date: dueDate,
          aging_bucket: agingBucket,
          status,
          updated_at: now,
        })
        .where(eq(accounts_receivable.id, existing.id));
      return;
    }

    await db.insert(accounts_receivable).values({
      id: createId(),
      organization_id: input.organizationId,
      customer_id: input.customerId,
      invoice_id: input.invoiceId,
      original_amount: originalAmount,
      balance_due: balanceDue,
      due_date: dueDate,
      aging_bucket: agingBucket,
      status,
      created_at: now,
      updated_at: now,
    });
  }

  async findByInvoiceId(
    invoiceId: string,
    db: DrizzleDB | Tx = this.db,
  ): Promise<{
    id: string;
    balance_due: string;
    status: ArStatus;
    aging_bucket: string | null;
  } | null> {
    const [row] = await db
      .select({
        id: accounts_receivable.id,
        balance_due: accounts_receivable.balance_due,
        status: accounts_receivable.status,
        aging_bucket: accounts_receivable.aging_bucket,
      })
      .from(accounts_receivable)
      .where(eq(accounts_receivable.invoice_id, invoiceId))
      .limit(1);
    return row
      ? {
          id: row.id,
          balance_due: row.balance_due,
          status: row.status as ArStatus,
          aging_bucket: row.aging_bucket,
        }
      : null;
  }

  /** Soft-close AR when invoice is cancelled (balance kept for audit). */
  async closeReceivableForCancelledInvoice(
    invoiceId: string,
    db: DrizzleDB | Tx = this.db,
  ): Promise<void> {
    const existing = await this.findByInvoiceId(invoiceId, db);
    if (!existing) return;
    await db
      .update(accounts_receivable)
      .set({
        status: AR_STATUS.WRITTEN_OFF,
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(accounts_receivable.id, existing.id));
  }
}
