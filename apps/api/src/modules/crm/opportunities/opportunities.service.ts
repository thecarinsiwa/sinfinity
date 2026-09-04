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
  customers,
  leads,
  opportunities,
  opportunity_items,
} from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../crm-scope';
import { CreateOpportunityDto, type OpportunityStage } from './dto/create-opportunity.dto';
import { ListOpportunitiesQueryDto } from './dto/list-opportunities-query.dto';
import {
  CreateOpportunityItemDto,
  OpportunityItemResponseDto,
  UpdateOpportunityItemDto,
} from './dto/opportunity-item.dto';
import { OpportunityResponseDto } from './dto/opportunity-response.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import {
  formatDecimal,
  resolveLineTotal,
  toOpportunityItemResponse,
  toOpportunityResponse,
  type OpportunityItemRow,
  type OpportunityRow,
} from './opportunities.mapper';

@Injectable()
export class OpportunitiesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListOpportunitiesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<OpportunityResponseDto>> {
    const {
      page,
      pageSize,
      search,
      organizationId,
      stage,
      customerId,
      leadId,
      ownerUserId,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      search,
      stage,
      customerId,
      leadId,
      ownerUserId,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(opportunities).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(opportunities)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(opportunities.created_at), asc(opportunities.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as OpportunityRow[]).map((row) => toOpportunityResponse(row)),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<OpportunityResponseDto> {
    const row = await this.requireOpportunityAccess(
      id,
      currentOrganizationId,
      user,
    );
    const items = await this.loadItems(id);
    return toOpportunityResponse(
      row,
      items.map(toOpportunityItemResponse),
    );
  }

  async create(
    dto: CreateOpportunityDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<OpportunityResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'opportunity',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureCustomerInOrg(dto.customerId, organizationId);
    await this.ensureLeadInOrg(dto.leadId, organizationId);

    const id = createId();
    try {
      await this.db.insert(opportunities).values({
        id,
        organization_id: organizationId,
        customer_id: dto.customerId,
        lead_id: dto.leadId ?? null,
        name: dto.name.trim(),
        stage: dto.stage ?? 'qualification',
        probability: dto.probability ?? 0,
        expected_close_date: dto.expectedCloseDate ?? null,
        amount: dto.amount ?? null,
        currency_id: dto.currencyId ?? null,
        owner_user_id: dto.ownerUserId ?? null,
        created_by: user?.id ?? null,
        updated_by: user?.id ?? null,
      });
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid customer, lead, currency or owner user reference',
      );
    }

    if (dto.items?.length) {
      for (const item of dto.items) {
        await this.insertItem(id, item);
      }
      if (dto.amount === undefined) {
        await this.recalculateAmount(id);
      }
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateOpportunityDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<OpportunityResponseDto> {
    const existing = await this.requireOpportunityAccess(
      id,
      currentOrganizationId,
      user,
    );

    if (dto.organizationId !== undefined) {
      assertOrgAccess(
        dto.organizationId,
        currentOrganizationId,
        user,
        'opportunity',
      );
      await ensureOrganizationExists(this.db, dto.organizationId);
    }

    const orgId = dto.organizationId ?? existing.organization_id;
    if (dto.customerId !== undefined) {
      await this.ensureCustomerInOrg(dto.customerId, orgId);
    }
    if (dto.leadId !== undefined) {
      await this.ensureLeadInOrg(dto.leadId, orgId);
    }

    const patch: Partial<{
      organization_id: string;
      customer_id: string;
      lead_id: string | null;
      name: string;
      stage: OpportunityStage;
      probability: number;
      expected_close_date: string | null;
      amount: string | null;
      currency_id: string | null;
      owner_user_id: string | null;
      updated_at: string;
      updated_by: string | null;
    }> = {
      updated_at: nowMysqlDateTime(),
      updated_by: user?.id ?? null,
    };

    if (dto.organizationId !== undefined)
      patch.organization_id = dto.organizationId;
    if (dto.customerId !== undefined) patch.customer_id = dto.customerId;
    if (dto.leadId !== undefined) patch.lead_id = dto.leadId;
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.stage !== undefined) patch.stage = dto.stage;
    if (dto.probability !== undefined) patch.probability = dto.probability;
    if (dto.expectedCloseDate !== undefined)
      patch.expected_close_date = dto.expectedCloseDate;
    if (dto.amount !== undefined) patch.amount = dto.amount;
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.ownerUserId !== undefined) patch.owner_user_id = dto.ownerUserId;

    try {
      await this.db
        .update(opportunities)
        .set(patch)
        .where(eq(opportunities.id, id));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid customer, lead, currency or owner user reference',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireOpportunityAccess(id, currentOrganizationId, user);
    await this.db
      .update(opportunities)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(opportunities.id, id));
  }

  // --- Items ---

  async listItems(
    opportunityId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<OpportunityItemResponseDto[]> {
    await this.requireOpportunityAccess(
      opportunityId,
      currentOrganizationId,
      user,
    );
    const rows = await this.loadItems(opportunityId);
    return rows.map(toOpportunityItemResponse);
  }

  async addItem(
    opportunityId: string,
    dto: CreateOpportunityItemDto,
    recalculateAmount: boolean,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<OpportunityItemResponseDto> {
    await this.requireOpportunityAccess(
      opportunityId,
      currentOrganizationId,
      user,
    );
    this.assertItemHasContent(dto);
    const itemId = await this.insertItem(opportunityId, dto);
    if (recalculateAmount) {
      await this.recalculateAmount(opportunityId);
    }
    return this.findItem(opportunityId, itemId);
  }

  async updateItem(
    opportunityId: string,
    itemId: string,
    dto: UpdateOpportunityItemDto,
    recalculateAmount: boolean,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<OpportunityItemResponseDto> {
    await this.requireOpportunityAccess(
      opportunityId,
      currentOrganizationId,
      user,
    );
    const existing = await this.findItemRow(opportunityId, itemId);

    const quantity = dto.quantity ?? existing.quantity;
    const unitPrice = dto.unitPrice ?? existing.unit_price;
    const shouldRecomputeLine =
      dto.lineTotal !== undefined ||
      dto.quantity !== undefined ||
      dto.unitPrice !== undefined;

    const patch: Partial<{
      product_id: string | null;
      service_id: string | null;
      description: string | null;
      quantity: string;
      unit_price: string;
      line_total: string;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.productId !== undefined) patch.product_id = dto.productId;
    if (dto.serviceId !== undefined) patch.service_id = dto.serviceId;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.quantity !== undefined) patch.quantity = dto.quantity;
    if (dto.unitPrice !== undefined) patch.unit_price = dto.unitPrice;
    if (shouldRecomputeLine) {
      patch.line_total = resolveLineTotal(quantity, unitPrice, dto.lineTotal);
    }

    try {
      await this.db
        .update(opportunity_items)
        .set(patch)
        .where(eq(opportunity_items.id, itemId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid product or service reference');
    }

    if (recalculateAmount) {
      await this.recalculateAmount(opportunityId);
    }

    return this.findItem(opportunityId, itemId);
  }

  async removeItem(
    opportunityId: string,
    itemId: string,
    recalculateAmount: boolean,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireOpportunityAccess(
      opportunityId,
      currentOrganizationId,
      user,
    );
    await this.findItemRow(opportunityId, itemId);
    await this.db
      .delete(opportunity_items)
      .where(eq(opportunity_items.id, itemId));
    if (recalculateAmount) {
      await this.recalculateAmount(opportunityId);
    }
  }

  private async recalculateAmount(opportunityId: string): Promise<void> {
    const rows = await this.loadItems(opportunityId);
    const sum = rows.reduce((acc, row) => acc + Number(row.line_total), 0);
    await this.db
      .update(opportunities)
      .set({
        amount: formatDecimal(sum),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(opportunities.id, opportunityId));
  }

  private async insertItem(
    opportunityId: string,
    dto: CreateOpportunityItemDto,
  ): Promise<string> {
    this.assertItemHasContent(dto);
    const quantity = dto.quantity ?? '1.0000';
    const unitPrice = dto.unitPrice ?? '0.0000';
    const lineTotal = resolveLineTotal(quantity, unitPrice, dto.lineTotal);
    const id = createId();
    try {
      await this.db.insert(opportunity_items).values({
        id,
        opportunity_id: opportunityId,
        product_id: dto.productId ?? null,
        service_id: dto.serviceId ?? null,
        description: dto.description ?? null,
        quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid product or service reference');
    }
    return id;
  }

  private assertItemHasContent(
    dto: Pick<
      CreateOpportunityItemDto,
      'productId' | 'serviceId' | 'description'
    >,
  ): void {
    if (!dto.productId && !dto.serviceId && !dto.description) {
      throw new BadRequestException(
        'At least one of productId, serviceId or description is required',
      );
    }
  }

  private async requireOpportunityAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<OpportunityRow> {
    const row = await this.findActiveRowById(id);
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'opportunity',
    );
    return row;
  }

  private async findActiveRowById(id: string): Promise<OpportunityRow> {
    const [row] = await this.db
      .select()
      .from(opportunities)
      .where(and(eq(opportunities.id, id), isNull(opportunities.deleted_at)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Opportunity ${id} not found`);
    }
    return row as OpportunityRow;
  }

  private async ensureCustomerInOrg(
    customerId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.id, customerId),
          eq(customers.organization_id, organizationId),
          isNull(customers.deleted_at),
        ),
      )
      .limit(1);

    if (!row) {
      throw new BadRequestException(
        'customerId must belong to the same organization',
      );
    }
  }

  private async ensureLeadInOrg(
    leadId: string | null | undefined,
    organizationId: string,
  ): Promise<void> {
    if (!leadId) return;

    const [row] = await this.db
      .select({ id: leads.id })
      .from(leads)
      .where(
        and(
          eq(leads.id, leadId),
          eq(leads.organization_id, organizationId),
          isNull(leads.deleted_at),
        ),
      )
      .limit(1);

    if (!row) {
      throw new BadRequestException(
        'leadId must belong to the same organization',
      );
    }
  }

  private async loadItems(
    opportunityId: string,
  ): Promise<OpportunityItemRow[]> {
    const rows = await this.db
      .select()
      .from(opportunity_items)
      .where(eq(opportunity_items.opportunity_id, opportunityId))
      .orderBy(asc(opportunity_items.created_at), asc(opportunity_items.id));
    return rows as OpportunityItemRow[];
  }

  private async findItem(
    opportunityId: string,
    itemId: string,
  ): Promise<OpportunityItemResponseDto> {
    return toOpportunityItemResponse(
      await this.findItemRow(opportunityId, itemId),
    );
  }

  private async findItemRow(
    opportunityId: string,
    itemId: string,
  ): Promise<OpportunityItemRow> {
    const [row] = await this.db
      .select()
      .from(opportunity_items)
      .where(
        and(
          eq(opportunity_items.id, itemId),
          eq(opportunity_items.opportunity_id, opportunityId),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Opportunity item ${itemId} not found`);
    }
    return row as OpportunityItemRow;
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
    stage?: string;
    customerId?: string;
    leadId?: string;
    ownerUserId?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(opportunities.organization_id, params.organizationId),
      isNull(opportunities.deleted_at),
    ];
    if (params.search) {
      parts.push(like(opportunities.name, `%${params.search}%`));
    }
    if (params.stage) {
      parts.push(
        eq(
          opportunities.stage,
          params.stage as
            | 'qualification'
            | 'proposal'
            | 'negotiation'
            | 'won'
            | 'lost',
        ),
      );
    }
    if (params.customerId) {
      parts.push(eq(opportunities.customer_id, params.customerId));
    }
    if (params.leadId) {
      parts.push(eq(opportunities.lead_id, params.leadId));
    }
    if (params.ownerUserId) {
      parts.push(eq(opportunities.owner_user_id, params.ownerUserId));
    }
    return and(...parts)!;
  }
}
