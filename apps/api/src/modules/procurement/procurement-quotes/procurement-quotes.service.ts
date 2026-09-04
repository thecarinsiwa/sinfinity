import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, isNull, ne } from 'drizzle-orm';
import { createId, type AuthUser } from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  products,
  procurement_quote_items,
  procurement_quotes,
  procurement_request_items,
  procurement_requests,
  suppliers,
} from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { assertOrgAccess } from '../procurement-scope';
import {
  PROCUREMENT_REQUEST_STATUS,
  type ProcurementRequestStatus,
} from '../procurement-requests/procurement-request-statuses';
import { CreateProcurementQuoteDto } from './dto/create-procurement-quote.dto';
import {
  CreateProcurementQuoteItemDto,
  ProcurementQuoteItemResponseDto,
  UpdateProcurementQuoteItemDto,
} from './dto/procurement-quote-item.dto';
import { ProcurementQuoteResponseDto } from './dto/procurement-quote-response.dto';
import { TransitionProcurementQuoteDto } from './dto/transition-procurement-quote.dto';
import { UpdateProcurementQuoteDto } from './dto/update-procurement-quote.dto';
import {
  assertProcurementQuoteTransition,
  PROCUREMENT_QUOTE_STATUS,
  type ProcurementQuoteStatus,
} from './procurement-quote-statuses';
import {
  toProcurementQuoteItemResponse,
  toProcurementQuoteResponse,
  type ProcurementQuoteItemRow,
  type ProcurementQuoteRow,
} from './procurement-quotes.mapper';

function formatDecimal(value: number, scale = 4): string {
  if (!Number.isFinite(value)) {
    throw new BadRequestException('Invalid decimal value');
  }
  return value.toFixed(scale);
}

type RequestScope = {
  id: string;
  organization_id: string;
  status: ProcurementRequestStatus;
};

@Injectable()
export class ProcurementQuotesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async list(
    requestId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProcurementQuoteResponseDto[]> {
    await this.requireRequestInScope(
      requestId,
      currentOrganizationId,
      user,
    );
    const rows = await this.db
      .select()
      .from(procurement_quotes)
      .where(eq(procurement_quotes.procurement_request_id, requestId))
      .orderBy(
        desc(procurement_quotes.created_at),
        asc(procurement_quotes.id),
      );
    return (rows as ProcurementQuoteRow[]).map((row) =>
      toProcurementQuoteResponse(row),
    );
  }

  async findOne(
    requestId: string,
    quoteId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProcurementQuoteResponseDto> {
    await this.requireRequestInScope(
      requestId,
      currentOrganizationId,
      user,
    );
    const row = await this.requireQuote(requestId, quoteId);
    const items = await this.loadItems(quoteId);
    return toProcurementQuoteResponse(
      row,
      items.map(toProcurementQuoteItemResponse),
    );
  }

  async create(
    requestId: string,
    dto: CreateProcurementQuoteDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProcurementQuoteResponseDto> {
    const request = await this.requireRequestInScope(
      requestId,
      currentOrganizationId,
      user,
    );
    this.assertQuotesAllowed(request.status);
    await this.ensureSupplierInOrg(dto.supplierId, request.organization_id);

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(procurement_quotes).values({
        id,
        procurement_request_id: requestId,
        supplier_id: dto.supplierId,
        quote_number: dto.quoteNumber ?? null,
        quote_date: dto.quoteDate ? dto.quoteDate.slice(0, 10) : null,
        valid_until: dto.validUntil ? dto.validUntil.slice(0, 10) : null,
        currency_id: dto.currencyId ?? null,
        shipping_term_id: dto.shippingTermId ?? null,
        lead_time_days: dto.leadTimeDays ?? null,
        status: PROCUREMENT_QUOTE_STATUS.RECEIVED,
        total_amount: '0.0000',
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid supplier, currency or shipping term reference',
      );
    }

    if (dto.items?.length) {
      for (const item of dto.items) {
        await this.insertItem(requestId, id, request.organization_id, item);
      }
      await this.recalculateTotal(id);
    }

    await this.bumpRequestToQuotedIfNeeded(request);

    return this.findOne(requestId, id, currentOrganizationId, user);
  }

  async update(
    requestId: string,
    quoteId: string,
    dto: UpdateProcurementQuoteDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProcurementQuoteResponseDto> {
    const request = await this.requireRequestInScope(
      requestId,
      currentOrganizationId,
      user,
    );
    this.assertQuotesMutable(request.status);
    const existing = await this.requireQuote(requestId, quoteId);
    if (existing.status === PROCUREMENT_QUOTE_STATUS.REJECTED) {
      throw new BadRequestException('Cannot update a rejected quote');
    }

    const patch: Partial<{
      quote_number: string | null;
      quote_date: string | null;
      valid_until: string | null;
      currency_id: string | null;
      shipping_term_id: string | null;
      lead_time_days: number | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.quoteNumber !== undefined) patch.quote_number = dto.quoteNumber;
    if (dto.quoteDate !== undefined) {
      patch.quote_date =
        dto.quoteDate != null ? dto.quoteDate.slice(0, 10) : null;
    }
    if (dto.validUntil !== undefined) {
      patch.valid_until =
        dto.validUntil != null ? dto.validUntil.slice(0, 10) : null;
    }
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.shippingTermId !== undefined)
      patch.shipping_term_id = dto.shippingTermId;
    if (dto.leadTimeDays !== undefined)
      patch.lead_time_days = dto.leadTimeDays;

    try {
      await this.db
        .update(procurement_quotes)
        .set(patch)
        .where(eq(procurement_quotes.id, quoteId));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid currency or shipping term reference',
      );
    }

    return this.findOne(requestId, quoteId, currentOrganizationId, user);
  }

  async remove(
    requestId: string,
    quoteId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const request = await this.requireRequestInScope(
      requestId,
      currentOrganizationId,
      user,
    );
    this.assertQuotesMutable(request.status);
    await this.requireQuote(requestId, quoteId);
    await this.db
      .delete(procurement_quotes)
      .where(eq(procurement_quotes.id, quoteId));
  }

  async transition(
    requestId: string,
    quoteId: string,
    dto: TransitionProcurementQuoteDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProcurementQuoteResponseDto> {
    const request = await this.requireRequestInScope(
      requestId,
      currentOrganizationId,
      user,
    );
    this.assertQuotesMutable(request.status);
    const existing = await this.requireQuote(requestId, quoteId);

    try {
      assertProcurementQuoteTransition(existing.status, dto.toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid quote status transition',
      );
    }

    if (dto.toStatus === PROCUREMENT_QUOTE_STATUS.SELECTED) {
      await this.db
        .update(procurement_quotes)
        .set({
          status: PROCUREMENT_QUOTE_STATUS.SHORTLISTED,
          updated_at: nowMysqlDateTime(),
        })
        .where(
          and(
            eq(procurement_quotes.procurement_request_id, requestId),
            eq(procurement_quotes.status, PROCUREMENT_QUOTE_STATUS.SELECTED),
            ne(procurement_quotes.id, quoteId),
          ),
        );
    }

    await this.db
      .update(procurement_quotes)
      .set({
        status: dto.toStatus,
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(procurement_quotes.id, quoteId));

    return this.findOne(requestId, quoteId, currentOrganizationId, user);
  }

  async listItems(
    requestId: string,
    quoteId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProcurementQuoteItemResponseDto[]> {
    await this.requireRequestInScope(
      requestId,
      currentOrganizationId,
      user,
    );
    await this.requireQuote(requestId, quoteId);
    const rows = await this.loadItems(quoteId);
    return rows.map(toProcurementQuoteItemResponse);
  }

  async addItem(
    requestId: string,
    quoteId: string,
    dto: CreateProcurementQuoteItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProcurementQuoteItemResponseDto> {
    const request = await this.requireRequestInScope(
      requestId,
      currentOrganizationId,
      user,
    );
    this.assertQuotesMutable(request.status);
    const quote = await this.requireQuote(requestId, quoteId);
    if (quote.status === PROCUREMENT_QUOTE_STATUS.REJECTED) {
      throw new BadRequestException('Cannot mutate items on a rejected quote');
    }
    const itemId = await this.insertItem(
      requestId,
      quoteId,
      request.organization_id,
      dto,
    );
    await this.recalculateTotal(quoteId);
    return this.findItem(quoteId, itemId);
  }

  async updateItem(
    requestId: string,
    quoteId: string,
    itemId: string,
    dto: UpdateProcurementQuoteItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProcurementQuoteItemResponseDto> {
    const request = await this.requireRequestInScope(
      requestId,
      currentOrganizationId,
      user,
    );
    this.assertQuotesMutable(request.status);
    const quote = await this.requireQuote(requestId, quoteId);
    if (quote.status === PROCUREMENT_QUOTE_STATUS.REJECTED) {
      throw new BadRequestException('Cannot mutate items on a rejected quote');
    }
    const existing = await this.requireItem(quoteId, itemId);

    if (dto.procurementRequestItemId !== undefined) {
      await this.ensureRequestItemBelongs(
        requestId,
        dto.procurementRequestItemId,
      );
    }
    if (dto.productId !== undefined && dto.productId != null) {
      await this.ensureProductInOrg(dto.productId, request.organization_id);
    }

    const quantity = dto.quantity ?? existing.quantity;
    const unitPrice = dto.unitPrice ?? existing.unit_price;
    const lineTotal = formatDecimal(Number(quantity) * Number(unitPrice));

    const patch: Partial<{
      procurement_request_item_id: string | null;
      product_id: string | null;
      quantity: string;
      unit_price: string;
      lead_time_days: number | null;
      notes: string | null;
      line_total: string;
      updated_at: string;
    }> = {
      line_total: lineTotal,
      updated_at: nowMysqlDateTime(),
    };

    if (dto.procurementRequestItemId !== undefined) {
      patch.procurement_request_item_id = dto.procurementRequestItemId;
    }
    if (dto.productId !== undefined) patch.product_id = dto.productId;
    if (dto.quantity !== undefined)
      patch.quantity = formatDecimal(Number(dto.quantity));
    if (dto.unitPrice !== undefined)
      patch.unit_price = formatDecimal(Number(dto.unitPrice));
    if (dto.leadTimeDays !== undefined)
      patch.lead_time_days = dto.leadTimeDays;
    if (dto.notes !== undefined) patch.notes = dto.notes;

    try {
      await this.db
        .update(procurement_quote_items)
        .set(patch)
        .where(eq(procurement_quote_items.id, itemId));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid request item or product reference',
      );
    }

    await this.recalculateTotal(quoteId);
    return this.findItem(quoteId, itemId);
  }

  async removeItem(
    requestId: string,
    quoteId: string,
    itemId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const request = await this.requireRequestInScope(
      requestId,
      currentOrganizationId,
      user,
    );
    this.assertQuotesMutable(request.status);
    const quote = await this.requireQuote(requestId, quoteId);
    if (quote.status === PROCUREMENT_QUOTE_STATUS.REJECTED) {
      throw new BadRequestException('Cannot mutate items on a rejected quote');
    }
    await this.requireItem(quoteId, itemId);
    await this.db
      .delete(procurement_quote_items)
      .where(eq(procurement_quote_items.id, itemId));
    await this.recalculateTotal(quoteId);
  }

  private async insertItem(
    requestId: string,
    quoteId: string,
    organizationId: string,
    dto: CreateProcurementQuoteItemDto,
  ): Promise<string> {
    await this.ensureRequestItemBelongs(
      requestId,
      dto.procurementRequestItemId,
    );
    if (dto.productId) {
      await this.ensureProductInOrg(dto.productId, organizationId);
    }

    const quantity = formatDecimal(Number(dto.quantity ?? '1'));
    const unitPrice = formatDecimal(Number(dto.unitPrice ?? '0'));
    const lineTotal = formatDecimal(Number(quantity) * Number(unitPrice));
    const id = createId();
    const now = nowMysqlDateTime();

    try {
      await this.db.insert(procurement_quote_items).values({
        id,
        procurement_quote_id: quoteId,
        procurement_request_item_id: dto.procurementRequestItemId ?? null,
        product_id: dto.productId ?? null,
        quantity,
        unit_price: unitPrice,
        lead_time_days: dto.leadTimeDays ?? null,
        notes: dto.notes ?? null,
        line_total: lineTotal,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid request item or product reference',
      );
    }
    return id;
  }

  private async recalculateTotal(quoteId: string): Promise<void> {
    const items = await this.loadItems(quoteId);
    const total = items.reduce(
      (sum, item) => sum + Number(item.line_total),
      0,
    );
    await this.db
      .update(procurement_quotes)
      .set({
        total_amount: formatDecimal(total),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(procurement_quotes.id, quoteId));
  }

  private async bumpRequestToQuotedIfNeeded(
    request: RequestScope,
  ): Promise<void> {
    if (request.status !== PROCUREMENT_REQUEST_STATUS.OPEN) return;
    await this.db
      .update(procurement_requests)
      .set({
        status: PROCUREMENT_REQUEST_STATUS.QUOTED,
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(procurement_requests.id, request.id));
  }

  private async findItem(
    quoteId: string,
    itemId: string,
  ): Promise<ProcurementQuoteItemResponseDto> {
    const row = await this.requireItem(quoteId, itemId);
    return toProcurementQuoteItemResponse(row);
  }

  private async requireItem(
    quoteId: string,
    itemId: string,
  ): Promise<ProcurementQuoteItemRow> {
    const [row] = await this.db
      .select()
      .from(procurement_quote_items)
      .where(
        and(
          eq(procurement_quote_items.id, itemId),
          eq(procurement_quote_items.procurement_quote_id, quoteId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Procurement quote item ${itemId} not found`,
      );
    }
    return row as ProcurementQuoteItemRow;
  }

  private async loadItems(
    quoteId: string,
  ): Promise<ProcurementQuoteItemRow[]> {
    const rows = await this.db
      .select()
      .from(procurement_quote_items)
      .where(eq(procurement_quote_items.procurement_quote_id, quoteId))
      .orderBy(
        asc(procurement_quote_items.created_at),
        asc(procurement_quote_items.id),
      );
    return rows as ProcurementQuoteItemRow[];
  }

  private async requireQuote(
    requestId: string,
    quoteId: string,
  ): Promise<ProcurementQuoteRow> {
    const [row] = await this.db
      .select()
      .from(procurement_quotes)
      .where(
        and(
          eq(procurement_quotes.id, quoteId),
          eq(procurement_quotes.procurement_request_id, requestId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Procurement quote ${quoteId} not found`);
    }
    return row as ProcurementQuoteRow;
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

  private assertQuotesAllowed(status: ProcurementRequestStatus): void {
    if (
      status !== PROCUREMENT_REQUEST_STATUS.OPEN &&
      status !== PROCUREMENT_REQUEST_STATUS.QUOTED &&
      status !== PROCUREMENT_REQUEST_STATUS.COMPARED
    ) {
      throw new BadRequestException(
        'Quotes can only be created while the request is open, quoted or compared',
      );
    }
  }

  private assertQuotesMutable(status: ProcurementRequestStatus): void {
    if (
      status === PROCUREMENT_REQUEST_STATUS.APPROVED ||
      status === PROCUREMENT_REQUEST_STATUS.CLOSED ||
      status === PROCUREMENT_REQUEST_STATUS.CANCELLED ||
      status === PROCUREMENT_REQUEST_STATUS.DRAFT
    ) {
      throw new BadRequestException(
        'Quotes cannot be mutated while the request is draft, approved, closed or cancelled',
      );
    }
  }

  private async ensureSupplierInOrg(
    supplierId: string,
    organizationId: string,
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
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Supplier must belong to the same organization',
      );
    }
  }

  private async ensureProductInOrg(
    productId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: products.id,
        organization_id: products.organization_id,
      })
      .from(products)
      .where(and(eq(products.id, productId), isNull(products.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Product must belong to the same organization',
      );
    }
  }

  private async ensureRequestItemBelongs(
    requestId: string,
    requestItemId: string | null | undefined,
  ): Promise<void> {
    if (requestItemId == null) return;
    const [row] = await this.db
      .select({
        id: procurement_request_items.id,
        procurement_request_id:
          procurement_request_items.procurement_request_id,
      })
      .from(procurement_request_items)
      .where(eq(procurement_request_items.id, requestItemId))
      .limit(1);
    if (!row || row.procurement_request_id !== requestId) {
      throw new BadRequestException(
        'procurementRequestItemId must belong to the same procurement request',
      );
    }
  }
}
