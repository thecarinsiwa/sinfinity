import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, inArray, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  accounts_payable,
  accounts_receivable,
} from '../../../database/schema';
import { formatDecimal } from '../../sales-orders/sales-orders-totals';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  AGING_BUCKETS,
  computeAgingBucket,
  type AgingBucket,
} from '../aging-buckets';
import { AP_STATUS, type ApStatus } from '../ap-statuses';
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

export type UpsertApInput = {
  organizationId: string;
  supplierId: string;
  purchaseOrderId: string;
  originalAmount: string;
  amountPaid?: string;
  dueDate?: string | null;
};

export type ArListItem = {
  id: string;
  organizationId: string;
  customerId: string;
  invoiceId: string;
  originalAmount: string;
  balanceDue: string;
  dueDate: string | null;
  agingBucket: AgingBucket | null;
  status: ArStatus;
  createdAt: string;
  updatedAt: string;
};

export type ApListItem = {
  id: string;
  organizationId: string;
  supplierId: string;
  purchaseOrderId: string | null;
  originalAmount: string;
  balanceDue: string;
  dueDate: string | null;
  agingBucket: AgingBucket | null;
  status: ApStatus;
  createdAt: string;
  updatedAt: string;
};

export type AgeingBucketAggregate = {
  bucket: AgingBucket;
  count: number;
  balanceDue: string;
};

function arStatusFromBalance(
  balanceDue: number,
  originalAmount: number,
): ArStatus {
  if (balanceDue <= 1e-9) return AR_STATUS.CLOSED;
  if (balanceDue + 1e-9 < originalAmount) return AR_STATUS.PARTIAL;
  return AR_STATUS.OPEN;
}

function apStatusFromBalance(
  balanceDue: number,
  originalAmount: number,
): ApStatus {
  if (balanceDue <= 1e-9) return AP_STATUS.PAID;
  if (balanceDue + 1e-9 < originalAmount) return AP_STATUS.PARTIAL;
  return AP_STATUS.OPEN;
}

function toDateOnly(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.slice(0, 10);
}

/**
 * Internal AR/AP upserts + ledger list/ageing. No free CRUD mutate.
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
    const dueDate = toDateOnly(input.dueDate);
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

  async upsertPayable(
    input: UpsertApInput,
    db: DrizzleDB | Tx = this.db,
  ): Promise<void> {
    const original = Number(input.originalAmount);
    const paid = Number(input.amountPaid ?? '0');
    const balance = Math.max(0, original - paid);
    const balanceDue = formatDecimal(balance);
    const originalAmount = formatDecimal(original);
    const dueDate = toDateOnly(input.dueDate);
    const status = apStatusFromBalance(balance, original);
    const now = nowMysqlDateTime();

    const [existing] = await db
      .select({ id: accounts_payable.id })
      .from(accounts_payable)
      .where(eq(accounts_payable.purchase_order_id, input.purchaseOrderId))
      .limit(1);

    if (existing) {
      await db
        .update(accounts_payable)
        .set({
          supplier_id: input.supplierId,
          original_amount: originalAmount,
          balance_due: balanceDue,
          due_date: dueDate,
          status,
          updated_at: now,
        })
        .where(eq(accounts_payable.id, existing.id));
      return;
    }

    await db.insert(accounts_payable).values({
      id: createId(),
      organization_id: input.organizationId,
      supplier_id: input.supplierId,
      purchase_order_id: input.purchaseOrderId,
      original_amount: originalAmount,
      balance_due: balanceDue,
      due_date: dueDate,
      status,
      created_at: now,
      updated_at: now,
    });
  }

  async cancelPayableForPurchaseOrder(
    purchaseOrderId: string,
    db: DrizzleDB | Tx = this.db,
  ): Promise<void> {
    const [existing] = await db
      .select({ id: accounts_payable.id })
      .from(accounts_payable)
      .where(eq(accounts_payable.purchase_order_id, purchaseOrderId))
      .limit(1);
    if (!existing) return;
    await db
      .update(accounts_payable)
      .set({
        status: AP_STATUS.CANCELLED,
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(accounts_payable.id, existing.id));
  }

  async findByInvoiceId(
    invoiceId: string,
    db: DrizzleDB | Tx = this.db,
  ): Promise<{
    id: string;
    balance_due: string;
    original_amount: string;
    status: ArStatus;
    aging_bucket: string | null;
  } | null> {
    const [row] = await db
      .select({
        id: accounts_receivable.id,
        balance_due: accounts_receivable.balance_due,
        original_amount: accounts_receivable.original_amount,
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
          original_amount: row.original_amount,
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

  async listReceivables(
    organizationId: string,
    query: {
      page: number;
      pageSize: number;
      customerId?: string;
      status?: ArStatus;
      openOnly?: boolean;
    },
  ): Promise<PaginatedResponseDto<ArListItem>> {
    const parts: SQL[] = [
      eq(accounts_receivable.organization_id, organizationId),
    ];
    if (query.customerId) {
      parts.push(eq(accounts_receivable.customer_id, query.customerId));
    }
    if (query.status) {
      parts.push(eq(accounts_receivable.status, query.status));
    }
    if (query.openOnly) {
      parts.push(
        inArray(accounts_receivable.status, [
          AR_STATUS.OPEN,
          AR_STATUS.PARTIAL,
        ]),
      );
    }
    const where = and(...parts)!;
    const offset = (query.page - 1) * query.pageSize;

    const listQuery = this.db.select().from(accounts_receivable).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(accounts_receivable)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(
          desc(accounts_receivable.due_date),
          asc(accounts_receivable.id),
        )
        .limit(query.pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      rows.map((row) => ({
        id: row.id,
        organizationId: row.organization_id,
        customerId: row.customer_id,
        invoiceId: row.invoice_id,
        originalAmount: row.original_amount,
        balanceDue: row.balance_due,
        dueDate: toDateOnly(row.due_date),
        agingBucket: computeAgingBucket(row.due_date),
        status: row.status as ArStatus,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      Number(totalRow?.total ?? 0),
      query.page,
      query.pageSize,
    );
  }

  async listPayables(
    organizationId: string,
    query: {
      page: number;
      pageSize: number;
      supplierId?: string;
      status?: ApStatus;
      openOnly?: boolean;
    },
  ): Promise<PaginatedResponseDto<ApListItem>> {
    const parts: SQL[] = [
      eq(accounts_payable.organization_id, organizationId),
    ];
    if (query.supplierId) {
      parts.push(eq(accounts_payable.supplier_id, query.supplierId));
    }
    if (query.status) {
      parts.push(eq(accounts_payable.status, query.status));
    }
    if (query.openOnly) {
      parts.push(
        inArray(accounts_payable.status, [AP_STATUS.OPEN, AP_STATUS.PARTIAL]),
      );
    }
    const where = and(...parts)!;
    const offset = (query.page - 1) * query.pageSize;

    const listQuery = this.db.select().from(accounts_payable).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(accounts_payable)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(accounts_payable.due_date), asc(accounts_payable.id))
        .limit(query.pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      rows.map((row) => ({
        id: row.id,
        organizationId: row.organization_id,
        supplierId: row.supplier_id,
        purchaseOrderId: row.purchase_order_id,
        originalAmount: row.original_amount,
        balanceDue: row.balance_due,
        dueDate: toDateOnly(row.due_date),
        agingBucket: computeAgingBucket(row.due_date),
        status: row.status as ApStatus,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      Number(totalRow?.total ?? 0),
      query.page,
      query.pageSize,
    );
  }

  async ageingReceivables(
    organizationId: string,
  ): Promise<AgeingBucketAggregate[]> {
    const rows = await this.db
      .select({
        due_date: accounts_receivable.due_date,
        balance_due: accounts_receivable.balance_due,
        status: accounts_receivable.status,
      })
      .from(accounts_receivable)
      .where(
        and(
          eq(accounts_receivable.organization_id, organizationId),
          inArray(accounts_receivable.status, [
            AR_STATUS.OPEN,
            AR_STATUS.PARTIAL,
          ]),
        ),
      );

    return this.aggregateAgeing(
      rows.map((r) => ({
        dueDate: r.due_date,
        balanceDue: r.balance_due,
      })),
    );
  }

  async ageingPayables(
    organizationId: string,
  ): Promise<AgeingBucketAggregate[]> {
    const rows = await this.db
      .select({
        due_date: accounts_payable.due_date,
        balance_due: accounts_payable.balance_due,
        status: accounts_payable.status,
      })
      .from(accounts_payable)
      .where(
        and(
          eq(accounts_payable.organization_id, organizationId),
          inArray(accounts_payable.status, [
            AP_STATUS.OPEN,
            AP_STATUS.PARTIAL,
          ]),
        ),
      );

    return this.aggregateAgeing(
      rows.map((r) => ({
        dueDate: r.due_date,
        balanceDue: r.balance_due,
      })),
    );
  }

  /** Refresh stored aging_bucket on open AR rows (best-effort). */
  async refreshReceivableAgingBuckets(
    organizationId: string,
  ): Promise<void> {
    const rows = await this.db
      .select({
        id: accounts_receivable.id,
        due_date: accounts_receivable.due_date,
      })
      .from(accounts_receivable)
      .where(
        and(
          eq(accounts_receivable.organization_id, organizationId),
          inArray(accounts_receivable.status, [
            AR_STATUS.OPEN,
            AR_STATUS.PARTIAL,
          ]),
        ),
      );

    const now = nowMysqlDateTime();
    for (const row of rows) {
      const bucket = computeAgingBucket(row.due_date);
      await this.db
        .update(accounts_receivable)
        .set({ aging_bucket: bucket, updated_at: now })
        .where(eq(accounts_receivable.id, row.id));
    }
  }

  private aggregateAgeing(
    rows: Array<{ dueDate: string | null; balanceDue: string }>,
  ): AgeingBucketAggregate[] {
    const map = new Map<AgingBucket, { count: number; balance: number }>();
    for (const bucket of AGING_BUCKETS) {
      map.set(bucket, { count: 0, balance: 0 });
    }
    for (const row of rows) {
      const bucket = computeAgingBucket(row.dueDate) ?? '0-30';
      const entry = map.get(bucket)!;
      entry.count += 1;
      entry.balance += Number(row.balanceDue);
    }
    return AGING_BUCKETS.map((bucket) => {
      const entry = map.get(bucket)!;
      return {
        bucket,
        count: entry.count,
        balanceDue: formatDecimal(entry.balance),
      };
    });
  }
}
