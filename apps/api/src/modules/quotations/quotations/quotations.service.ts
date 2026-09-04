import {
  BadRequestException,
  ConflictException,
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
  customers,
  opportunities,
  products,
  quotation_items,
  quotation_statuses,
  quotation_terms,
  quotations,
  services,
  taxes,
} from '../../../database/schema';
import {
  isMysqlDuplicateError,
  throwDuplicateOrRethrow,
  throwFkOrRethrow,
} from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  QUOTATION_STATUS_CODE,
} from '../quotation-statuses/quotation-statuses.catalog';
import { QuotationStatusesSeedService } from '../quotation-statuses/quotation-statuses-seed.service';
import {
  toQuotationStatusResponse,
  type QuotationStatusRow,
} from '../quotation-statuses/quotation-statuses.mapper';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../quotations-scope';
import {
  computeHeaderTotals,
  computeLineTotals,
  formatDecimal,
} from '../quotations-totals';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { ListQuotationsQueryDto } from './dto/list-quotations-query.dto';
import {
  CreateQuotationItemDto,
  QuotationItemResponseDto,
  UpdateQuotationItemDto,
} from './dto/quotation-item.dto';
import { QuotationResponseDto } from './dto/quotation-response.dto';
import {
  QuotationTermsResponseDto,
  UpsertQuotationTermsDto,
} from './dto/quotation-terms.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import {
  toQuotationItemResponse,
  toQuotationResponse,
  toQuotationTermsResponse,
  type QuotationItemRow,
  type QuotationRow,
  type QuotationTermsRow,
} from './quotations.mapper';

@Injectable()
export class QuotationsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly statusesSeed: QuotationStatusesSeedService,
  ) {}

  async findAll(
    query: ListQuotationsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<QuotationResponseDto>> {
    const {
      page,
      pageSize,
      search,
      organizationId,
      statusCode,
      customerId,
      opportunityId,
      ownerUserId,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = await this.buildWhere({
      organizationId: scopeOrgId,
      search,
      statusCode,
      customerId,
      opportunityId,
      ownerUserId,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(quotations).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(quotations)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(quotations.created_at), asc(quotations.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as QuotationRow[]).map((row) => toQuotationResponse(row)),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<QuotationResponseDto> {
    const row = await this.requireQuotationAccess(
      id,
      currentOrganizationId,
      user,
    );
    const [status, items, terms] = await Promise.all([
      this.loadStatus(row.status_id),
      this.loadItems(id),
      this.loadTerms(id),
    ]);
    return toQuotationResponse(row, {
      status: status ?? undefined,
      items: items.map(toQuotationItemResponse),
      terms: terms ? toQuotationTermsResponse(terms) : null,
    });
  }

  async create(
    dto: CreateQuotationDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<QuotationResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'quotation',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureCustomerInOrg(dto.customerId, organizationId);
    await this.ensureOpportunityInOrg(dto.opportunityId, organizationId);

    const draftStatusId = await this.requireStatusIdByCode(
      QUOTATION_STATUS_CODE.DRAFT,
    );
    const id = createId();

    try {
      await this.db.insert(quotations).values({
        id,
        organization_id: organizationId,
        quote_number: dto.quoteNumber.trim(),
        customer_id: dto.customerId,
        opportunity_id: dto.opportunityId ?? null,
        status_id: draftStatusId,
        version: 1,
        issue_date: dto.issueDate ? dto.issueDate.slice(0, 10) : null,
        valid_until: dto.validUntil ? dto.validUntil.slice(0, 10) : null,
        currency_id: dto.currencyId ?? null,
        exchange_rate: dto.exchangeRate ?? null,
        subtotal: '0.0000',
        tax_amount: '0.0000',
        total_amount: '0.0000',
        owner_user_id: dto.ownerUserId ?? null,
        notes: dto.notes ?? null,
        created_by: user?.id ?? null,
        updated_by: user?.id ?? null,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Quote number already exists for this organization',
        );
      }
      throwFkOrRethrow(
        error,
        'Invalid customer, opportunity, currency or owner user reference',
      );
    }

    if (dto.items?.length) {
      for (const item of dto.items) {
        await this.insertItem(id, organizationId, item);
      }
      await this.recalculateTotals(id);
    }

    if (dto.terms) {
      await this.upsertTermsRow(id, dto.terms, user);
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateQuotationDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<QuotationResponseDto> {
    const existing = await this.requireQuotationAccess(
      id,
      currentOrganizationId,
      user,
    );
    await this.assertDraft(existing);

    if (dto.organizationId !== undefined) {
      assertOrgAccess(
        dto.organizationId,
        currentOrganizationId,
        user,
        'quotation',
      );
      await ensureOrganizationExists(this.db, dto.organizationId);
    }

    const orgId = dto.organizationId ?? existing.organization_id;
    if (dto.customerId !== undefined) {
      await this.ensureCustomerInOrg(dto.customerId, orgId);
    }
    if (dto.opportunityId !== undefined) {
      await this.ensureOpportunityInOrg(dto.opportunityId, orgId);
    }

    const patch: Partial<{
      organization_id: string;
      quote_number: string;
      customer_id: string;
      opportunity_id: string | null;
      issue_date: string | null;
      valid_until: string | null;
      currency_id: string | null;
      exchange_rate: string | null;
      owner_user_id: string | null;
      notes: string | null;
      updated_at: string;
      updated_by: string | null;
    }> = {
      updated_at: nowMysqlDateTime(),
      updated_by: user?.id ?? null,
    };

    if (dto.organizationId !== undefined)
      patch.organization_id = dto.organizationId;
    if (dto.quoteNumber !== undefined)
      patch.quote_number = dto.quoteNumber.trim();
    if (dto.customerId !== undefined) patch.customer_id = dto.customerId;
    if (dto.opportunityId !== undefined)
      patch.opportunity_id = dto.opportunityId;
    if (dto.issueDate !== undefined)
      patch.issue_date = dto.issueDate ? dto.issueDate.slice(0, 10) : null;
    if (dto.validUntil !== undefined)
      patch.valid_until = dto.validUntil ? dto.validUntil.slice(0, 10) : null;
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.exchangeRate !== undefined) patch.exchange_rate = dto.exchangeRate;
    if (dto.ownerUserId !== undefined) patch.owner_user_id = dto.ownerUserId;
    if (dto.notes !== undefined) patch.notes = dto.notes;

    try {
      await this.db.update(quotations).set(patch).where(eq(quotations.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Quote number already exists for this organization',
        );
      }
      throwFkOrRethrow(
        error,
        'Invalid customer, opportunity, currency or owner user reference',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireQuotationAccess(id, currentOrganizationId, user);
    await this.db
      .update(quotations)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(quotations.id, id));
  }

  // --- Items ---

  async listItems(
    quotationId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<QuotationItemResponseDto[]> {
    await this.requireQuotationAccess(
      quotationId,
      currentOrganizationId,
      user,
    );
    const rows = await this.loadItems(quotationId);
    return rows.map(toQuotationItemResponse);
  }

  async addItem(
    quotationId: string,
    dto: CreateQuotationItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<QuotationItemResponseDto> {
    const quotation = await this.requireQuotationAccess(
      quotationId,
      currentOrganizationId,
      user,
    );
    await this.assertDraft(quotation);
    this.assertItemHasContent(dto);
    const itemId = await this.insertItem(
      quotationId,
      quotation.organization_id,
      dto,
    );
    await this.recalculateTotals(quotationId, user?.id ?? null);
    return this.findItem(quotationId, itemId);
  }

  async updateItem(
    quotationId: string,
    itemId: string,
    dto: UpdateQuotationItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<QuotationItemResponseDto> {
    const quotation = await this.requireQuotationAccess(
      quotationId,
      currentOrganizationId,
      user,
    );
    await this.assertDraft(quotation);
    const existing = await this.requireItem(quotationId, itemId);

    const quantity = dto.quantity ?? existing.quantity;
    const unitPrice = dto.unitPrice ?? existing.unit_price;
    const discountPercent = dto.discountPercent ?? existing.discount_percent;
    const taxId = dto.taxId !== undefined ? dto.taxId : existing.tax_id;
    const taxRate = await this.resolveTaxRate(
      taxId,
      quotation.organization_id,
    );
    const { lineTotal } = computeLineTotals({
      quantity,
      unitPrice,
      discountPercent,
      taxRatePercent: taxRate,
    });

    if (dto.productId !== undefined || dto.serviceId !== undefined) {
      await this.ensureCatalogRefsInOrg(
        quotation.organization_id,
        dto.productId !== undefined ? dto.productId : existing.product_id,
        dto.serviceId !== undefined ? dto.serviceId : existing.service_id,
      );
    }

    const patch: Partial<{
      line_number: number;
      product_id: string | null;
      service_id: string | null;
      description: string | null;
      quantity: string;
      unit_id: string | null;
      unit_price: string;
      discount_percent: string;
      tax_id: string | null;
      line_total: string;
      updated_at: string;
    }> = {
      line_total: lineTotal,
      updated_at: nowMysqlDateTime(),
    };

    if (dto.lineNumber !== undefined) patch.line_number = dto.lineNumber;
    if (dto.productId !== undefined) patch.product_id = dto.productId;
    if (dto.serviceId !== undefined) patch.service_id = dto.serviceId;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.quantity !== undefined)
      patch.quantity = formatDecimal(Number(dto.quantity));
    if (dto.unitId !== undefined) patch.unit_id = dto.unitId;
    if (dto.unitPrice !== undefined)
      patch.unit_price = formatDecimal(Number(dto.unitPrice));
    if (dto.discountPercent !== undefined)
      patch.discount_percent = formatDecimal(Number(dto.discountPercent));
    if (dto.taxId !== undefined) patch.tax_id = dto.taxId;

    try {
      await this.db
        .update(quotation_items)
        .set(patch)
        .where(eq(quotation_items.id, itemId));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid product, service, unit or tax reference',
      );
    }

    await this.recalculateTotals(quotationId, user?.id ?? null);
    return this.findItem(quotationId, itemId);
  }

  async removeItem(
    quotationId: string,
    itemId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const quotation = await this.requireQuotationAccess(
      quotationId,
      currentOrganizationId,
      user,
    );
    await this.assertDraft(quotation);
    await this.requireItem(quotationId, itemId);
    await this.db
      .delete(quotation_items)
      .where(eq(quotation_items.id, itemId));
    await this.recalculateTotals(quotationId, user?.id ?? null);
  }

  // --- Terms (1:1) ---

  async getTerms(
    quotationId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<QuotationTermsResponseDto | null> {
    await this.requireQuotationAccess(
      quotationId,
      currentOrganizationId,
      user,
    );
    const row = await this.loadTerms(quotationId);
    return row ? toQuotationTermsResponse(row) : null;
  }

  async upsertTerms(
    quotationId: string,
    dto: UpsertQuotationTermsDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<QuotationTermsResponseDto> {
    const quotation = await this.requireQuotationAccess(
      quotationId,
      currentOrganizationId,
      user,
    );
    await this.assertDraft(quotation);
    await this.upsertTermsRow(quotationId, dto, user);
    const row = await this.loadTerms(quotationId);
    return toQuotationTermsResponse(row!);
  }

  private async upsertTermsRow(
    quotationId: string,
    dto: UpsertQuotationTermsDto,
    user?: AuthUser,
  ): Promise<void> {
    const existing = await this.loadTerms(quotationId);
    if (existing) {
      const patch: Partial<{
        payment_term_id: string | null;
        shipping_term_id: string | null;
        warranty_text: string | null;
        delivery_lead_time_days: number | null;
        additional_terms: string | null;
        updated_at: string;
      }> = { updated_at: nowMysqlDateTime() };

      if (dto.paymentTermId !== undefined)
        patch.payment_term_id = dto.paymentTermId;
      if (dto.shippingTermId !== undefined)
        patch.shipping_term_id = dto.shippingTermId;
      if (dto.warrantyText !== undefined) patch.warranty_text = dto.warrantyText;
      if (dto.deliveryLeadTimeDays !== undefined)
        patch.delivery_lead_time_days = dto.deliveryLeadTimeDays;
      if (dto.additionalTerms !== undefined)
        patch.additional_terms = dto.additionalTerms;

      try {
        await this.db
          .update(quotation_terms)
          .set(patch)
          .where(eq(quotation_terms.id, existing.id));
      } catch (error) {
        throwFkOrRethrow(
          error,
          'Invalid payment term or shipping term reference',
        );
      }
      return;
    }

    try {
      await this.db.insert(quotation_terms).values({
        id: createId(),
        quotation_id: quotationId,
        payment_term_id: dto.paymentTermId ?? null,
        shipping_term_id: dto.shippingTermId ?? null,
        warranty_text: dto.warrantyText ?? null,
        delivery_lead_time_days: dto.deliveryLeadTimeDays ?? null,
        additional_terms: dto.additionalTerms ?? null,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throw new ConflictException(
          'Quotation terms already exist for this quotation',
        );
      }
      throwFkOrRethrow(
        error,
        'Invalid payment term or shipping term reference',
      );
    }
    void user;
  }

  private async insertItem(
    quotationId: string,
    organizationId: string,
    dto: CreateQuotationItemDto,
  ): Promise<string> {
    this.assertItemHasContent(dto);
    await this.ensureCatalogRefsInOrg(
      organizationId,
      dto.productId ?? null,
      dto.serviceId ?? null,
    );
    const quantity = formatDecimal(Number(dto.quantity ?? '1'));
    const unitPrice = formatDecimal(Number(dto.unitPrice ?? '0'));
    const discountPercent = formatDecimal(Number(dto.discountPercent ?? '0'));
    const taxRate = await this.resolveTaxRate(dto.taxId ?? null, organizationId);
    const { lineTotal } = computeLineTotals({
      quantity,
      unitPrice,
      discountPercent,
      taxRatePercent: taxRate,
    });

    const id = createId();
    try {
      await this.db.insert(quotation_items).values({
        id,
        quotation_id: quotationId,
        line_number: dto.lineNumber ?? 1,
        product_id: dto.productId ?? null,
        service_id: dto.serviceId ?? null,
        description: dto.description ?? null,
        quantity,
        unit_id: dto.unitId ?? null,
        unit_price: unitPrice,
        discount_percent: discountPercent,
        tax_id: dto.taxId ?? null,
        line_total: lineTotal,
      });
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid product, service, unit or tax reference',
      );
    }
    return id;
  }

  private async recalculateTotals(
    quotationId: string,
    updatedBy?: string | null,
  ): Promise<void> {
    const items = await this.loadItems(quotationId);
    const [quotation] = await this.db
      .select({ organization_id: quotations.organization_id })
      .from(quotations)
      .where(eq(quotations.id, quotationId))
      .limit(1);

    const lines: Array<{ lineTotal: string; lineTax: string }> = [];
    for (const item of items) {
      const taxRate = await this.resolveTaxRate(
        item.tax_id,
        quotation!.organization_id,
      );
      const computed = computeLineTotals({
        quantity: item.quantity,
        unitPrice: item.unit_price,
        discountPercent: item.discount_percent,
        taxRatePercent: taxRate,
      });
      lines.push({
        lineTotal: item.line_total,
        lineTax: computed.lineTax,
      });
    }

    const totals = computeHeaderTotals(lines);
    await this.db
      .update(quotations)
      .set({
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        total_amount: totals.totalAmount,
        updated_at: nowMysqlDateTime(),
        ...(updatedBy !== undefined ? { updated_by: updatedBy } : {}),
      })
      .where(eq(quotations.id, quotationId));
  }

  private async resolveTaxRate(
    taxId: string | null | undefined,
    organizationId: string,
  ): Promise<string | null> {
    if (!taxId) return null;
    const [row] = await this.db
      .select({
        id: taxes.id,
        rate: taxes.rate,
        organization_id: taxes.organization_id,
        deleted_at: taxes.deleted_at,
      })
      .from(taxes)
      .where(eq(taxes.id, taxId))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new BadRequestException(`Tax ${taxId} not found`);
    }
    if (row.organization_id != null && row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Tax must be global or belong to the same organization',
      );
    }
    return row.rate;
  }

  private async findItem(
    quotationId: string,
    itemId: string,
  ): Promise<QuotationItemResponseDto> {
    const row = await this.requireItem(quotationId, itemId);
    return toQuotationItemResponse(row);
  }

  private async requireItem(
    quotationId: string,
    itemId: string,
  ): Promise<QuotationItemRow> {
    const [row] = await this.db
      .select()
      .from(quotation_items)
      .where(
        and(
          eq(quotation_items.id, itemId),
          eq(quotation_items.quotation_id, quotationId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Quotation item ${itemId} not found`);
    }
    return row as QuotationItemRow;
  }

  private async loadItems(quotationId: string): Promise<QuotationItemRow[]> {
    const rows = await this.db
      .select()
      .from(quotation_items)
      .where(eq(quotation_items.quotation_id, quotationId))
      .orderBy(asc(quotation_items.line_number), asc(quotation_items.id));
    return rows as QuotationItemRow[];
  }

  private async loadTerms(
    quotationId: string,
  ): Promise<QuotationTermsRow | null> {
    const [row] = await this.db
      .select()
      .from(quotation_terms)
      .where(eq(quotation_terms.quotation_id, quotationId))
      .limit(1);
    return (row as QuotationTermsRow | undefined) ?? null;
  }

  private async loadStatus(
    statusId: string | null,
  ): Promise<ReturnType<typeof toQuotationStatusResponse> | null> {
    if (!statusId) return null;
    const [row] = await this.db
      .select()
      .from(quotation_statuses)
      .where(eq(quotation_statuses.id, statusId))
      .limit(1);
    if (!row) return null;
    return toQuotationStatusResponse(row as QuotationStatusRow);
  }

  private async requireQuotationAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<QuotationRow> {
    const [row] = await this.db
      .select()
      .from(quotations)
      .where(and(eq(quotations.id, id), isNull(quotations.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Quotation ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'quotation',
    );
    return row as QuotationRow;
  }

  private async assertDraft(quotation: QuotationRow): Promise<void> {
    const status = await this.loadStatus(quotation.status_id);
    if (!status || status.code !== QUOTATION_STATUS_CODE.DRAFT) {
      throw new BadRequestException(
        'Quotation can only be edited while status is DRAFT',
      );
    }
  }

  private async requireStatusIdByCode(code: string): Promise<string> {
    const [row] = await this.db
      .select({ id: quotation_statuses.id })
      .from(quotation_statuses)
      .where(eq(quotation_statuses.code, code))
      .limit(1);
    if (row) return row.id;

    await this.statusesSeed.seed();
    const [seeded] = await this.db
      .select({ id: quotation_statuses.id })
      .from(quotation_statuses)
      .where(eq(quotation_statuses.code, code))
      .limit(1);
    if (!seeded) {
      throw new NotFoundException(`Quotation status code ${code} not found`);
    }
    return seeded.id;
  }

  private assertItemHasContent(
    dto: Pick<
      CreateQuotationItemDto,
      'productId' | 'serviceId' | 'description'
    >,
  ): void {
    const hasProduct = dto.productId != null && dto.productId !== '';
    const hasService = dto.serviceId != null && dto.serviceId !== '';
    const hasDescription =
      dto.description != null && dto.description.trim() !== '';
    if (!hasProduct && !hasService && !hasDescription) {
      throw new BadRequestException(
        'Item requires at least one of productId, serviceId or description',
      );
    }
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

  private async ensureOpportunityInOrg(
    opportunityId: string | null | undefined,
    organizationId: string,
  ): Promise<void> {
    if (opportunityId == null) return;
    const [row] = await this.db
      .select({
        id: opportunities.id,
        organization_id: opportunities.organization_id,
      })
      .from(opportunities)
      .where(
        and(
          eq(opportunities.id, opportunityId),
          isNull(opportunities.deleted_at),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Opportunity ${opportunityId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Opportunity must belong to the same organization',
      );
    }
  }

  private async ensureCatalogRefsInOrg(
    organizationId: string,
    productId: string | null,
    serviceId: string | null,
  ): Promise<void> {
    if (productId) {
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
    if (serviceId) {
      const [row] = await this.db
        .select({
          id: services.id,
          organization_id: services.organization_id,
        })
        .from(services)
        .where(and(eq(services.id, serviceId), isNull(services.deleted_at)))
        .limit(1);
      if (!row) {
        throw new NotFoundException(`Service ${serviceId} not found`);
      }
      if (row.organization_id !== organizationId) {
        throw new BadRequestException(
          'Service must belong to the same organization',
        );
      }
    }
  }

  private async buildWhere(params: {
    organizationId: string;
    search?: string;
    statusCode?: string;
    customerId?: string;
    opportunityId?: string;
    ownerUserId?: string;
  }): Promise<SQL> {
    const parts: SQL[] = [
      eq(quotations.organization_id, params.organizationId),
      isNull(quotations.deleted_at),
    ];
    if (params.search) {
      parts.push(like(quotations.quote_number, `%${params.search}%`));
    }
    if (params.customerId) {
      parts.push(eq(quotations.customer_id, params.customerId));
    }
    if (params.opportunityId) {
      parts.push(eq(quotations.opportunity_id, params.opportunityId));
    }
    if (params.ownerUserId) {
      parts.push(eq(quotations.owner_user_id, params.ownerUserId));
    }
    if (params.statusCode) {
      const [status] = await this.db
        .select({ id: quotation_statuses.id })
        .from(quotation_statuses)
        .where(eq(quotation_statuses.code, params.statusCode))
        .limit(1);
      if (!status) {
        throw new BadRequestException(
          `Unknown statusCode ${params.statusCode}`,
        );
      }
      parts.push(eq(quotations.status_id, status.id));
    }
    return and(...parts)!;
  }
}
