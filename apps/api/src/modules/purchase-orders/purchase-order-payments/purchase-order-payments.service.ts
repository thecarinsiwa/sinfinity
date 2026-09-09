import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { createId, type AuthUser } from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  purchase_order_payments,
  purchase_orders,
} from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { assertOrgAccess } from '../purchase-orders-scope';
import { formatDecimal } from '../purchase-orders-totals';
import {
  CreatePurchaseOrderPaymentDto,
  PurchaseOrderPaymentResponseDto,
  UpdatePurchaseOrderPaymentDto,
} from './dto/purchase-order-payment.dto';
import {
  toPurchaseOrderPaymentResponse,
  type PurchaseOrderPaymentRow,
} from './purchase-order-payments.mapper';

function toMysqlDateTime(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.replace('T', ' ').replace('Z', '');
}

/**
 * Supplier payment rows against a PO.
 * TODO(Phase 17): optionally create/update accounts_payable linked via
 * accounts_payable.purchase_order_id when recording payments — not done here.
 */
@Injectable()
export class PurchaseOrderPaymentsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async list(
    orderId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PurchaseOrderPaymentResponseDto[]> {
    await this.requireOrderInScope(orderId, currentOrganizationId, user);
    const rows = await this.db
      .select()
      .from(purchase_order_payments)
      .where(eq(purchase_order_payments.purchase_order_id, orderId))
      .orderBy(
        desc(purchase_order_payments.paid_at),
        desc(purchase_order_payments.created_at),
        asc(purchase_order_payments.id),
      );
    return (rows as PurchaseOrderPaymentRow[]).map(
      toPurchaseOrderPaymentResponse,
    );
  }

  async create(
    orderId: string,
    dto: CreatePurchaseOrderPaymentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PurchaseOrderPaymentResponseDto> {
    await this.requireOrderInScope(orderId, currentOrganizationId, user);
    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(purchase_order_payments).values({
        id,
        purchase_order_id: orderId,
        amount: formatDecimal(Number(dto.amount)),
        currency_id: dto.currencyId ?? null,
        payment_method_id: dto.paymentMethodId ?? null,
        paid_at: toMysqlDateTime(dto.paidAt),
        reference: dto.reference ?? null,
        notes: dto.notes ?? null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid currency, payment method or purchase order reference',
      );
    }
    return this.requireRow(orderId, id, currentOrganizationId, user);
  }

  async update(
    orderId: string,
    paymentId: string,
    dto: UpdatePurchaseOrderPaymentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PurchaseOrderPaymentResponseDto> {
    await this.requireRow(orderId, paymentId, currentOrganizationId, user);

    const patch: Partial<{
      amount: string;
      currency_id: string | null;
      payment_method_id: string | null;
      paid_at: string | null;
      reference: string | null;
      notes: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.amount !== undefined)
      patch.amount = formatDecimal(Number(dto.amount));
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.paymentMethodId !== undefined)
      patch.payment_method_id = dto.paymentMethodId;
    if (dto.paidAt !== undefined) patch.paid_at = toMysqlDateTime(dto.paidAt);
    if (dto.reference !== undefined) patch.reference = dto.reference;
    if (dto.notes !== undefined) patch.notes = dto.notes;

    try {
      await this.db
        .update(purchase_order_payments)
        .set(patch)
        .where(eq(purchase_order_payments.id, paymentId));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid currency, payment method or purchase order reference',
      );
    }

    return this.requireRow(orderId, paymentId, currentOrganizationId, user);
  }

  async remove(
    orderId: string,
    paymentId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireRow(orderId, paymentId, currentOrganizationId, user);
    await this.db
      .delete(purchase_order_payments)
      .where(eq(purchase_order_payments.id, paymentId));
  }

  private async requireRow(
    orderId: string,
    paymentId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PurchaseOrderPaymentResponseDto> {
    await this.requireOrderInScope(orderId, currentOrganizationId, user);
    const [row] = await this.db
      .select()
      .from(purchase_order_payments)
      .where(
        and(
          eq(purchase_order_payments.id, paymentId),
          eq(purchase_order_payments.purchase_order_id, orderId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Purchase order payment ${paymentId} not found`,
      );
    }
    return toPurchaseOrderPaymentResponse(row as PurchaseOrderPaymentRow);
  }

  private async requireOrderInScope(
    orderId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<{ id: string; organization_id: string }> {
    const [row] = await this.db
      .select({
        id: purchase_orders.id,
        organization_id: purchase_orders.organization_id,
      })
      .from(purchase_orders)
      .where(
        and(
          eq(purchase_orders.id, orderId),
          isNull(purchase_orders.deleted_at),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Purchase order ${orderId} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'purchase order',
    );
    return row;
  }
}
