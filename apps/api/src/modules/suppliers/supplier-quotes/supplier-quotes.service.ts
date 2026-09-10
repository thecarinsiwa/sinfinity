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
  products,
  supplier_quote_items,
  supplier_quotes,
  suppliers,
} from '../../../database/schema';
import {
  isMysqlDuplicateError,
  throwDuplicateOrRethrow,
  throwFkOrRethrow,
} from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../suppliers-scope';
import { CreateSupplierQuoteDto } from './dto/create-supplier-quote.dto';
import { ListSupplierQuotesQueryDto } from './dto/list-supplier-quotes-query.dto';
import {
  CreateSupplierQuoteItemDto,
  SupplierQuoteItemResponseDto,
  UpdateSupplierQuoteItemDto,
} from './dto/supplier-quote-item.dto';
import { SupplierQuoteResponseDto } from './dto/supplier-quote-response.dto';
import { TransitionSupplierQuoteDto } from './dto/transition-supplier-quote.dto';
import { UpdateSupplierQuoteDto } from './dto/update-supplier-quote.dto';
import {
  assertSupplierQuoteMutable,
  assertSupplierQuoteTransition,
  SUPPLIER_QUOTE_STATUS,
  type SupplierQuoteStatus,
} from './supplier-quote-statuses';
import {
  toSupplierQuoteItemResponse,
  toSupplierQuoteResponse,
  type SupplierQuoteItemRow,
  type SupplierQuoteRow,
} from './supplier-quotes.mapper';

function formatDecimal(value: number, scale = 4): string {
  if (!Number.isFinite(value)) {
    throw new BadRequestException('Invalid decimal value');
  }
  return value.toFixed(scale);
}

function parseDecimal(raw: string, field: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    throw new BadRequestException(`${field} must be a valid decimal`);
  }
  return n;
}

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function generateQuoteNumber(): string {
  return `SQ-${Date.now().toString(36).toUpperCase()}`;
}

function computeLineTotal(quantity: string, unitPrice: string): string {
  return formatDecimal(
    parseDecimal(quantity, 'quantity') * parseDecimal(unitPrice, 'unitPrice'),
  );
}

@Injectable()
export class SupplierQuotesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListSupplierQuotesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<SupplierQuoteResponseDto>> {
    const { page, pageSize, organizationId, supplierId, status, search } =
      query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [
      eq(supplier_quotes.organization_id, scopeOrgId),
      isNull(supplier_quotes.deleted_at),
    ];
    if (supplierId) {
      parts.push(eq(supplier_quotes.supplier_id, supplierId));
    }
    if (status) {
      parts.push(eq(supplier_quotes.status, status));
    }
    if (search?.trim()) {
      parts.push(like(supplier_quotes.quote_number, `%${search.trim()}%`));
    }
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(supplier_quotes).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(supplier_quotes)
      .$dynamic();

    const [rows, totalRow] = await Promise.all([
      listQuery
        .where(where)
        .orderBy(desc(supplier_quotes.quote_date), desc(supplier_quotes.created_at))
        .limit(pageSize)
        .offset(offset),
      countQuery.where(where),
    ]);

    return buildPaginatedResponse(
      (rows as SupplierQuoteRow[]).map((row) => toSupplierQuoteResponse(row)),
      Number(totalRow[0]?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierQuoteResponseDto> {
    const row = await this.requireQuoteAccess(id, currentOrganizationId, user);
    const items = await this.loadItems(id);
    return toSupplierQuoteResponse(
      row,
      items.map(toSupplierQuoteItemResponse),
    );
  }

  async create(
    dto: CreateSupplierQuoteDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierQuoteResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'supplier quote',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureSupplierInOrg(dto.supplierId, organizationId);
    if (dto.currencyId) {
      await this.ensureCurrencyExists(dto.currencyId);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    const quoteNumber = dto.quoteNumber?.trim() || generateQuoteNumber();
    const quoteDate = dto.quoteDate
      ? dto.quoteDate.slice(0, 10)
      : todayUtcDate();

    try {
      await this.db.insert(supplier_quotes).values({
        id,
        organization_id: organizationId,
        supplier_id: dto.supplierId,
        quote_number: quoteNumber,
        quote_date: quoteDate,
        valid_until: dto.validUntil ? dto.validUntil.slice(0, 10) : null,
        currency_id: dto.currencyId ?? null,
        status: SUPPLIER_QUOTE_STATUS.DRAFT,
        notes: dto.notes ?? null,
        created_at: now,
        updated_at: now,
        created_by: user?.id ?? null,
        updated_by: user?.id ?? null,
        deleted_at: null,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          `quote_number "${quoteNumber}" already exists in this organization`,
        );
      }
      throwFkOrRethrow(error, 'Invalid supplier or currency reference');
    }

    if (dto.items?.length) {
      for (const item of dto.items) {
        await this.insertItem(id, organizationId, item);
      }
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateSupplierQuoteDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierQuoteResponseDto> {
    const existing = await this.requireQuoteAccess(
      id,
      currentOrganizationId,
      user,
    );
    this.assertMutable(existing.status);

    if (dto.supplierId) {
      await this.ensureSupplierInOrg(
        dto.supplierId,
        existing.organization_id,
      );
    }
    if (dto.currencyId) {
      await this.ensureCurrencyExists(dto.currencyId);
    }

    const patch: Partial<{
      quote_number: string;
      quote_date: string;
      valid_until: string | null;
      currency_id: string | null;
      supplier_id: string;
      notes: string | null;
      updated_at: string;
      updated_by: string | null;
    }> = {
      updated_at: nowMysqlDateTime(),
      updated_by: user?.id ?? null,
    };

    if (dto.quoteNumber !== undefined) {
      const next = dto.quoteNumber.trim();
      if (!next) {
        throw new BadRequestException('quoteNumber cannot be empty');
      }
      patch.quote_number = next;
    }
    if (dto.quoteDate !== undefined) {
      patch.quote_date = dto.quoteDate.slice(0, 10);
    }
    if (dto.validUntil !== undefined) {
      patch.valid_until =
        dto.validUntil != null ? dto.validUntil.slice(0, 10) : null;
    }
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.supplierId !== undefined) patch.supplier_id = dto.supplierId;
    if (dto.notes !== undefined) patch.notes = dto.notes;

    try {
      await this.db
        .update(supplier_quotes)
        .set(patch)
        .where(eq(supplier_quotes.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'quote_number already exists in this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid supplier or currency reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireQuoteAccess(id, currentOrganizationId, user);
    await this.db
      .update(supplier_quotes)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(supplier_quotes.id, id));
  }

  async transition(
    id: string,
    dto: TransitionSupplierQuoteDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierQuoteResponseDto> {
    const existing = await this.requireQuoteAccess(
      id,
      currentOrganizationId,
      user,
    );
    try {
      assertSupplierQuoteTransition(existing.status, dto.toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    await this.db
      .update(supplier_quotes)
      .set({
        status: dto.toStatus,
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(supplier_quotes.id, id));

    return this.findOne(id, currentOrganizationId, user);
  }

  async listItems(
    quoteId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierQuoteItemResponseDto[]> {
    await this.requireQuoteAccess(quoteId, currentOrganizationId, user);
    const items = await this.loadItems(quoteId);
    return items.map(toSupplierQuoteItemResponse);
  }

  async addItem(
    quoteId: string,
    dto: CreateSupplierQuoteItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierQuoteItemResponseDto> {
    const quote = await this.requireQuoteAccess(
      quoteId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(quote.status);
    const itemId = await this.insertItem(quoteId, quote.organization_id, dto);
    await this.touchQuote(quoteId, user?.id);
    return this.requireItemResponse(quoteId, itemId);
  }

  async updateItem(
    quoteId: string,
    itemId: string,
    dto: UpdateSupplierQuoteItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierQuoteItemResponseDto> {
    const quote = await this.requireQuoteAccess(
      quoteId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(quote.status);
    const existing = await this.requireItem(quoteId, itemId);

    if (dto.productId) {
      await this.ensureProductInOrg(dto.productId, quote.organization_id);
    }

    const quantity = dto.quantity ?? existing.quantity;
    const unitPrice = dto.unitPrice ?? existing.unit_price;
    const patch: Partial<{
      product_id: string | null;
      description: string | null;
      quantity: string;
      unit_price: string;
      lead_time_days: number | null;
      line_total: string;
      updated_at: string;
    }> = {
      quantity: formatDecimal(parseDecimal(quantity, 'quantity')),
      unit_price: formatDecimal(parseDecimal(unitPrice, 'unitPrice')),
      line_total: computeLineTotal(quantity, unitPrice),
      updated_at: nowMysqlDateTime(),
    };
    if (dto.productId !== undefined) patch.product_id = dto.productId;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.leadTimeDays !== undefined) patch.lead_time_days = dto.leadTimeDays;

    try {
      await this.db
        .update(supplier_quote_items)
        .set(patch)
        .where(eq(supplier_quote_items.id, itemId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid product reference');
    }

    await this.touchQuote(quoteId, user?.id);
    return this.requireItemResponse(quoteId, itemId);
  }

  async removeItem(
    quoteId: string,
    itemId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const quote = await this.requireQuoteAccess(
      quoteId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(quote.status);
    await this.requireItem(quoteId, itemId);
    await this.db
      .delete(supplier_quote_items)
      .where(eq(supplier_quote_items.id, itemId));
    await this.touchQuote(quoteId, user?.id);
  }

  private async insertItem(
    quoteId: string,
    organizationId: string,
    dto: CreateSupplierQuoteItemDto,
  ): Promise<string> {
    if (dto.productId) {
      await this.ensureProductInOrg(dto.productId, organizationId);
    }
    const quantity = formatDecimal(
      parseDecimal(dto.quantity ?? '1.0000', 'quantity'),
    );
    const unitPrice = formatDecimal(
      parseDecimal(dto.unitPrice ?? '0.0000', 'unitPrice'),
    );
    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(supplier_quote_items).values({
        id,
        supplier_quote_id: quoteId,
        product_id: dto.productId ?? null,
        description: dto.description ?? null,
        quantity,
        unit_price: unitPrice,
        lead_time_days: dto.leadTimeDays ?? null,
        line_total: computeLineTotal(quantity, unitPrice),
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid product reference');
    }
    return id;
  }

  private assertMutable(status: SupplierQuoteStatus): void {
    try {
      assertSupplierQuoteMutable(status);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Quote is not mutable',
      );
    }
  }

  private async touchQuote(
    quoteId: string,
    userId: string | undefined,
  ): Promise<void> {
    await this.db
      .update(supplier_quotes)
      .set({
        updated_at: nowMysqlDateTime(),
        updated_by: userId ?? null,
      })
      .where(eq(supplier_quotes.id, quoteId));
  }

  private async loadItems(quoteId: string): Promise<SupplierQuoteItemRow[]> {
    const rows = await this.db
      .select()
      .from(supplier_quote_items)
      .where(eq(supplier_quote_items.supplier_quote_id, quoteId))
      .orderBy(asc(supplier_quote_items.created_at), asc(supplier_quote_items.id));
    return rows as SupplierQuoteItemRow[];
  }

  private async requireItemResponse(
    quoteId: string,
    itemId: string,
  ): Promise<SupplierQuoteItemResponseDto> {
    const row = await this.requireItem(quoteId, itemId);
    return toSupplierQuoteItemResponse(row);
  }

  private async requireItem(
    quoteId: string,
    itemId: string,
  ): Promise<SupplierQuoteItemRow> {
    const [row] = await this.db
      .select()
      .from(supplier_quote_items)
      .where(
        and(
          eq(supplier_quote_items.id, itemId),
          eq(supplier_quote_items.supplier_quote_id, quoteId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Supplier quote item ${itemId} not found`);
    }
    return row as SupplierQuoteItemRow;
  }

  private async requireQuoteAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupplierQuoteRow> {
    const [row] = await this.db
      .select()
      .from(supplier_quotes)
      .where(eq(supplier_quotes.id, id))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Supplier quote ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'supplier quote',
    );
    return row as SupplierQuoteRow;
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
      .where(
        and(eq(suppliers.id, supplierId), isNull(suppliers.deleted_at)),
      )
      .limit(1);
    if (!row || row.organization_id !== organizationId) {
      throw new BadRequestException(
        'supplierId must belong to the same organization',
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
    if (!row || row.organization_id !== organizationId) {
      throw new BadRequestException(
        'productId must belong to the same organization',
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
      throw new BadRequestException(`Currency ${currencyId} not found`);
    }
  }
}
