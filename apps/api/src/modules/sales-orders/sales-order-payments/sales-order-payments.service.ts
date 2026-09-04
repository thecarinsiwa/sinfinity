import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { createId, type AuthUser } from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  sales_order_payments,
  sales_orders,
} from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { assertOrgAccess } from '../sales-orders-scope';
import { formatDecimal } from '../sales-orders-totals';
import {
  CreateSalesOrderPaymentDto,
  SalesOrderPaymentResponseDto,
  UpdateSalesOrderPaymentDto,
} from './dto/sales-order-payment.dto';
import {
  toSalesOrderPaymentResponse,
  type SalesOrderPaymentRow,
} from './sales-order-payments.mapper';

function toMysqlDateTime(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.replace('T', ' ').replace('Z', '');
}

@Injectable()
export class SalesOrderPaymentsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async list(
    orderId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesOrderPaymentResponseDto[]> {
    await this.requireOrderInScope(orderId, currentOrganizationId, user);
    const rows = await this.db
      .select()
      .from(sales_order_payments)
      .where(eq(sales_order_payments.sales_order_id, orderId))
      .orderBy(
        desc(sales_order_payments.paid_at),
        desc(sales_order_payments.created_at),
        asc(sales_order_payments.id),
      );
    return (rows as SalesOrderPaymentRow[]).map(toSalesOrderPaymentResponse);
  }

  async create(
    orderId: string,
    dto: CreateSalesOrderPaymentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesOrderPaymentResponseDto> {
    await this.requireOrderInScope(orderId, currentOrganizationId, user);
    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(sales_order_payments).values({
        id,
        sales_order_id: orderId,
        payment_id: dto.paymentId ?? null,
        payment_type: dto.paymentType ?? 'partial',
        amount: formatDecimal(Number(dto.amount)),
        currency_id: dto.currencyId ?? null,
        paid_at: toMysqlDateTime(dto.paidAt),
        reference: dto.reference ?? null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid payment, currency or sales order reference',
      );
    }
    return this.requireRow(orderId, id, currentOrganizationId, user);
  }

  async update(
    orderId: string,
    paymentLinkId: string,
    dto: UpdateSalesOrderPaymentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesOrderPaymentResponseDto> {
    await this.requireRow(
      orderId,
      paymentLinkId,
      currentOrganizationId,
      user,
    );

    const patch: Partial<{
      payment_id: string | null;
      payment_type: 'deposit' | 'partial' | 'balance';
      amount: string;
      currency_id: string | null;
      paid_at: string | null;
      reference: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.paymentId !== undefined) patch.payment_id = dto.paymentId;
    if (dto.paymentType !== undefined) patch.payment_type = dto.paymentType;
    if (dto.amount !== undefined)
      patch.amount = formatDecimal(Number(dto.amount));
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.paidAt !== undefined) patch.paid_at = toMysqlDateTime(dto.paidAt);
    if (dto.reference !== undefined) patch.reference = dto.reference;

    try {
      await this.db
        .update(sales_order_payments)
        .set(patch)
        .where(eq(sales_order_payments.id, paymentLinkId));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid payment, currency or sales order reference',
      );
    }

    return this.requireRow(
      orderId,
      paymentLinkId,
      currentOrganizationId,
      user,
    );
  }

  async remove(
    orderId: string,
    paymentLinkId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireRow(
      orderId,
      paymentLinkId,
      currentOrganizationId,
      user,
    );
    await this.db
      .delete(sales_order_payments)
      .where(eq(sales_order_payments.id, paymentLinkId));
  }

  private async requireRow(
    orderId: string,
    paymentLinkId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SalesOrderPaymentResponseDto> {
    await this.requireOrderInScope(orderId, currentOrganizationId, user);
    const [row] = await this.db
      .select()
      .from(sales_order_payments)
      .where(
        and(
          eq(sales_order_payments.id, paymentLinkId),
          eq(sales_order_payments.sales_order_id, orderId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Sales order payment ${paymentLinkId} not found`,
      );
    }
    return toSalesOrderPaymentResponse(row as SalesOrderPaymentRow);
  }

  private async requireOrderInScope(
    orderId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<{ id: string; organization_id: string }> {
    const [row] = await this.db
      .select({
        id: sales_orders.id,
        organization_id: sales_orders.organization_id,
      })
      .from(sales_orders)
      .where(
        and(eq(sales_orders.id, orderId), isNull(sales_orders.deleted_at)),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Sales order ${orderId} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'sales order',
    );
    return row;
  }
}
