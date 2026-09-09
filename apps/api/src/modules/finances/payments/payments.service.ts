import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  isNull,
  like,
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
  customers,
  invoices,
  payment_methods,
  payments,
  sales_order_payments,
  sales_orders,
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
import { AccountsLedgerService } from '../ledger/accounts-ledger.service';
import { PAYMENT_STATUS } from '../payment-statuses';
import {
  ConfirmPaymentDto,
  CreatePaymentDto,
  ListPaymentsQueryDto,
  PaymentResponseDto,
  UpdatePaymentDto,
} from './dto/payment.dto';
import {
  paymentPaidAtToMysql,
  toPaymentResponse,
  type PaymentRow,
} from './payments.mapper';

type Tx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly accountsLedger: AccountsLedgerService,
  ) {}

  async findAll(
    query: ListPaymentsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<PaymentResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      status,
      customerId,
      invoiceId,
      search,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [eq(payments.organization_id, scopeOrgId)];
    if (status) parts.push(eq(payments.status, status));
    if (customerId) parts.push(eq(payments.customer_id, customerId));
    if (invoiceId) parts.push(eq(payments.invoice_id, invoiceId));
    if (search?.trim()) {
      parts.push(like(payments.reference, `%${search.trim()}%`));
    }
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(payments).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(payments)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(payments.paid_at), asc(payments.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as PaymentRow[]).map(toPaymentResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaymentResponseDto> {
    const row = await this.requirePaymentAccess(
      id,
      currentOrganizationId,
      user,
    );
    return toPaymentResponse(row);
  }

  async create(
    dto: CreatePaymentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaymentResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'payment',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureCustomerInOrg(dto.customerId, organizationId);
    if (dto.invoiceId) {
      await this.ensureInvoiceLinkable(
        dto.invoiceId,
        organizationId,
        dto.customerId,
      );
    }
    if (dto.paymentMethodId) {
      await this.ensureMethodInOrg(dto.paymentMethodId, organizationId);
    }
    if (dto.currencyId) {
      await this.ensureCurrencyExists(dto.currencyId);
    }

    const amount = formatDecimal(Number(dto.amount));
    if (Number(amount) <= 0) {
      throw new BadRequestException('amount must be greater than zero');
    }

    const confirmImmediately = dto.confirmImmediately === true;
    const id = createId();
    const now = nowMysqlDateTime();
    const paidAt = paymentPaidAtToMysql(dto.paidAt);

    try {
      await this.db.transaction(async (tx) => {
        await tx.insert(payments).values({
          id,
          organization_id: organizationId,
          customer_id: dto.customerId,
          invoice_id: dto.invoiceId ?? null,
          payment_method_id: dto.paymentMethodId ?? null,
          amount,
          currency_id: dto.currencyId ?? null,
          paid_at: paidAt,
          reference: dto.reference ?? null,
          status: confirmImmediately
            ? PAYMENT_STATUS.CONFIRMED
            : PAYMENT_STATUS.PENDING,
          created_at: now,
          updated_at: now,
        });

        if (confirmImmediately) {
          await this.applyConfirmedPayment(
            {
              id,
              organization_id: organizationId,
              customer_id: dto.customerId,
              invoice_id: dto.invoiceId ?? null,
              amount,
            },
            dto.salesOrderPaymentId,
            tx,
          );
        } else if (dto.salesOrderPaymentId) {
          await this.linkSalesOrderPayment(
            dto.salesOrderPaymentId,
            id,
            organizationId,
            dto.customerId,
            tx,
          );
        }
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid payment reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdatePaymentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaymentResponseDto> {
    const existing = await this.requirePaymentAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (existing.status !== PAYMENT_STATUS.PENDING) {
      throw new BadRequestException(
        'Only pending payments can be updated',
      );
    }

    if (dto.invoiceId) {
      await this.ensureInvoiceLinkable(
        dto.invoiceId,
        existing.organization_id,
        existing.customer_id,
      );
    }
    if (dto.paymentMethodId) {
      await this.ensureMethodInOrg(
        dto.paymentMethodId,
        existing.organization_id,
      );
    }
    if (dto.currencyId) {
      await this.ensureCurrencyExists(dto.currencyId);
    }

    const patch: Partial<{
      invoice_id: string | null;
      payment_method_id: string | null;
      amount: string;
      currency_id: string | null;
      paid_at: string;
      reference: string | null;
      updated_at: string;
    }> = {
      updated_at: nowMysqlDateTime(),
    };

    if (dto.invoiceId !== undefined) patch.invoice_id = dto.invoiceId;
    if (dto.paymentMethodId !== undefined) {
      patch.payment_method_id = dto.paymentMethodId;
    }
    if (dto.amount !== undefined) {
      const amount = formatDecimal(Number(dto.amount));
      if (Number(amount) <= 0) {
        throw new BadRequestException('amount must be greater than zero');
      }
      patch.amount = amount;
    }
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.paidAt !== undefined) {
      patch.paid_at = paymentPaidAtToMysql(dto.paidAt);
    }
    if (dto.reference !== undefined) patch.reference = dto.reference;

    try {
      await this.db.update(payments).set(patch).where(eq(payments.id, id));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid payment reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async confirm(
    id: string,
    dto: ConfirmPaymentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaymentResponseDto> {
    const existing = await this.requirePaymentAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (existing.status !== PAYMENT_STATUS.PENDING) {
      throw new BadRequestException(
        `Cannot confirm a payment in status "${existing.status}"`,
      );
    }

    await this.db.transaction(async (tx) => {
      await tx
        .update(payments)
        .set({
          status: PAYMENT_STATUS.CONFIRMED,
          updated_at: nowMysqlDateTime(),
        })
        .where(eq(payments.id, id));

      await this.applyConfirmedPayment(
        {
          id: existing.id,
          organization_id: existing.organization_id,
          customer_id: existing.customer_id,
          invoice_id: existing.invoice_id,
          amount: existing.amount,
        },
        dto.salesOrderPaymentId,
        tx,
      );
    });

    return this.findOne(id, currentOrganizationId, user);
  }

  async reverse(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaymentResponseDto> {
    const existing = await this.requirePaymentAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (existing.status !== PAYMENT_STATUS.CONFIRMED) {
      throw new BadRequestException(
        `Cannot reverse a payment in status "${existing.status}"`,
      );
    }

    await this.db.transaction(async (tx) => {
      await tx
        .update(payments)
        .set({
          status: PAYMENT_STATUS.REVERSED,
          updated_at: nowMysqlDateTime(),
        })
        .where(eq(payments.id, id));

      if (existing.invoice_id) {
        await this.rollbackInvoicePayment(
          existing.invoice_id,
          existing.amount,
          tx,
        );
      }
    });

    return this.findOne(id, currentOrganizationId, user);
  }

  async markFailed(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaymentResponseDto> {
    const existing = await this.requirePaymentAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (existing.status !== PAYMENT_STATUS.PENDING) {
      throw new BadRequestException(
        `Cannot fail a payment in status "${existing.status}"`,
      );
    }
    await this.db
      .update(payments)
      .set({
        status: PAYMENT_STATUS.FAILED,
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(payments.id, id));
    return this.findOne(id, currentOrganizationId, user);
  }

  // --- Private apply / rollback ---

  private async applyConfirmedPayment(
    payment: {
      id: string;
      organization_id: string;
      customer_id: string;
      invoice_id: string | null;
      amount: string;
    },
    salesOrderPaymentId: string | null | undefined,
    db: DrizzleDB | Tx,
  ): Promise<void> {
    if (payment.invoice_id) {
      await this.applyInvoicePayment(payment.invoice_id, payment.amount, db);
    }
    if (salesOrderPaymentId) {
      await this.linkSalesOrderPayment(
        salesOrderPaymentId,
        payment.id,
        payment.organization_id,
        payment.customer_id,
        db,
      );
    }
  }

  private async applyInvoicePayment(
    invoiceId: string,
    paymentAmount: string,
    db: DrizzleDB | Tx,
  ): Promise<void> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), isNull(invoices.deleted_at)))
      .limit(1);
    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }
    this.assertInvoiceAcceptsPayment(invoice.status as InvoiceStatus);

    const newPaid = formatDecimal(
      Number(invoice.amount_paid) + Number(paymentAmount),
    );
    const newStatus = invoiceStatusFromPayments(
      newPaid,
      invoice.total_amount,
      invoice.status as InvoiceStatus,
    );

    await db
      .update(invoices)
      .set({
        amount_paid: newPaid,
        status: newStatus,
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(invoices.id, invoiceId));

    await this.accountsLedger.upsertReceivable(
      {
        organizationId: invoice.organization_id,
        customerId: invoice.customer_id,
        invoiceId,
        originalAmount: invoice.total_amount,
        amountPaid: newPaid,
        dueDate: invoice.due_date,
      },
      db,
    );
  }

  private async rollbackInvoicePayment(
    invoiceId: string,
    paymentAmount: string,
    db: DrizzleDB | Tx,
  ): Promise<void> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), isNull(invoices.deleted_at)))
      .limit(1);
    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }
    if (
      invoice.status === INVOICE_STATUS.DRAFT ||
      invoice.status === INVOICE_STATUS.CANCELLED
    ) {
      return;
    }

    const newPaid = formatDecimal(
      Math.max(0, Number(invoice.amount_paid) - Number(paymentAmount)),
    );
    const newStatus = invoiceStatusFromPayments(
      newPaid,
      invoice.total_amount,
      invoice.status as InvoiceStatus,
    );

    await db
      .update(invoices)
      .set({
        amount_paid: newPaid,
        status: newStatus,
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(invoices.id, invoiceId));

    await this.accountsLedger.upsertReceivable(
      {
        organizationId: invoice.organization_id,
        customerId: invoice.customer_id,
        invoiceId,
        originalAmount: invoice.total_amount,
        amountPaid: newPaid,
        dueDate: invoice.due_date,
      },
      db,
    );
  }

  private assertInvoiceAcceptsPayment(status: InvoiceStatus): void {
    if (
      status === INVOICE_STATUS.DRAFT ||
      status === INVOICE_STATUS.CANCELLED ||
      status === INVOICE_STATUS.PAID
    ) {
      throw new BadRequestException(
        `Cannot apply payment to an invoice in status "${status}"`,
      );
    }
  }

  private async linkSalesOrderPayment(
    salesOrderPaymentId: string,
    paymentId: string,
    organizationId: string,
    customerId: string,
    db: DrizzleDB | Tx,
  ): Promise<void> {
    const [link] = await db
      .select({
        id: sales_order_payments.id,
        sales_order_id: sales_order_payments.sales_order_id,
        payment_id: sales_order_payments.payment_id,
      })
      .from(sales_order_payments)
      .where(eq(sales_order_payments.id, salesOrderPaymentId))
      .limit(1);
    if (!link) {
      throw new NotFoundException(
        `Sales order payment ${salesOrderPaymentId} not found`,
      );
    }
    if (link.payment_id != null && link.payment_id !== paymentId) {
      throw new BadRequestException(
        'Sales order payment is already linked to another payment',
      );
    }

    const [order] = await db
      .select({
        organization_id: sales_orders.organization_id,
        customer_id: sales_orders.customer_id,
      })
      .from(sales_orders)
      .where(eq(sales_orders.id, link.sales_order_id))
      .limit(1);
    if (!order) {
      throw new NotFoundException('Sales order for payment link not found');
    }
    if (order.organization_id !== organizationId) {
      throw new BadRequestException(
        'Sales order payment must belong to the same organization',
      );
    }
    if (order.customer_id !== customerId) {
      throw new BadRequestException(
        'Sales order payment customer must match the payment customer',
      );
    }

    await db
      .update(sales_order_payments)
      .set({
        payment_id: paymentId,
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(sales_order_payments.id, salesOrderPaymentId));
  }

  private async requirePaymentAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaymentRow> {
    const [row] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Payment ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'payment',
    );
    return row as PaymentRow;
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
        status: invoices.status,
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
        'Invoice customer must match the payment customer',
      );
    }
  }

  private async ensureMethodInOrg(
    methodId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: payment_methods.id,
        organization_id: payment_methods.organization_id,
        is_active: payment_methods.is_active,
      })
      .from(payment_methods)
      .where(eq(payment_methods.id, methodId))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Payment method ${methodId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Payment method must belong to the same organization',
      );
    }
    if (row.is_active === 0) {
      throw new BadRequestException('Payment method is inactive');
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
