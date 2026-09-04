import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, isNull, like, or, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  customer_categories,
  customers,
  lead_sources,
  leads,
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
} from '../crm-scope';
import {
  toCustomerResponse,
  type CustomerRow,
} from '../customers/customers.mapper';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import {
  CreateLeadDto,
  type LeadPatchStatus,
  type LeadStatus,
} from './dto/create-lead.dto';
import {
  ConvertLeadResponseDto,
  LeadResponseDto,
} from './dto/lead-response.dto';
import { ListLeadsQueryDto } from './dto/list-leads-query.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { toLeadResponse, type LeadRow } from './leads.mapper';

const CONVERTIBLE_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified'];

const STATUS_TRANSITIONS: Record<LeadStatus, LeadPatchStatus[]> = {
  new: ['contacted', 'qualified', 'lost'],
  contacted: ['qualified', 'lost'],
  qualified: ['lost'],
  converted: [],
  lost: [],
};

@Injectable()
export class LeadsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListLeadsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<LeadResponseDto>> {
    const {
      page,
      pageSize,
      search,
      organizationId,
      status,
      sourceId,
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
      status,
      sourceId,
      ownerUserId,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(leads).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(leads)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(leads.created_at), asc(leads.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as LeadRow[]).map(toLeadResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<LeadResponseDto> {
    const row = await this.requireLeadAccess(id, currentOrganizationId, user);
    return toLeadResponse(row);
  }

  async create(
    dto: CreateLeadDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<LeadResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'lead',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureSourceInOrg(dto.sourceId, organizationId);

    const id = createId();
    try {
      await this.db.insert(leads).values({
        id,
        organization_id: organizationId,
        source_id: dto.sourceId ?? null,
        company_name: dto.companyName ?? null,
        contact_name: dto.contactName ?? null,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        status: dto.status ?? 'new',
        owner_user_id: dto.ownerUserId ?? null,
        estimated_value: dto.estimatedValue ?? null,
        currency_id: dto.currencyId ?? null,
        created_by: user?.id ?? null,
        updated_by: user?.id ?? null,
      });
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid source, owner user or currency reference',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateLeadDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<LeadResponseDto> {
    const existing = await this.requireLeadAccess(
      id,
      currentOrganizationId,
      user,
    );

    if (dto.organizationId !== undefined) {
      assertOrgAccess(dto.organizationId, currentOrganizationId, user, 'lead');
      await ensureOrganizationExists(this.db, dto.organizationId);
    }

    const orgId = dto.organizationId ?? existing.organization_id;
    if (dto.sourceId !== undefined) {
      await this.ensureSourceInOrg(dto.sourceId, orgId);
    }

    if (dto.status !== undefined && dto.status !== existing.status) {
      this.assertStatusTransition(existing.status, dto.status);
    }

    const patch: Partial<{
      organization_id: string;
      source_id: string | null;
      company_name: string | null;
      contact_name: string | null;
      email: string | null;
      phone: string | null;
      status: LeadStatus;
      owner_user_id: string | null;
      estimated_value: string | null;
      currency_id: string | null;
      updated_at: string;
      updated_by: string | null;
    }> = {
      updated_at: nowMysqlDateTime(),
      updated_by: user?.id ?? null,
    };

    if (dto.organizationId !== undefined)
      patch.organization_id = dto.organizationId;
    if (dto.sourceId !== undefined) patch.source_id = dto.sourceId;
    if (dto.companyName !== undefined) patch.company_name = dto.companyName;
    if (dto.contactName !== undefined) patch.contact_name = dto.contactName;
    if (dto.email !== undefined) patch.email = dto.email;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.ownerUserId !== undefined) patch.owner_user_id = dto.ownerUserId;
    if (dto.estimatedValue !== undefined)
      patch.estimated_value = dto.estimatedValue;
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;

    try {
      await this.db.update(leads).set(patch).where(eq(leads.id, id));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid source, owner user or currency reference',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireLeadAccess(id, currentOrganizationId, user);
    await this.db
      .update(leads)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(leads.id, id));
  }

  async convert(
    id: string,
    dto: ConvertLeadDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ConvertLeadResponseDto> {
    const lead = await this.requireLeadAccess(id, currentOrganizationId, user);

    if (!CONVERTIBLE_STATUSES.includes(lead.status)) {
      throw new ConflictException(
        `Cannot convert a lead with status "${lead.status}"`,
      );
    }

    const name =
      dto.name?.trim() ||
      lead.company_name?.trim() ||
      lead.contact_name?.trim();
    if (!name) {
      throw new BadRequestException(
        'name is required when the lead has no companyName or contactName',
      );
    }

    await this.ensureCategoryInOrg(dto.categoryId, lead.organization_id);

    const customerId = createId();
    const code =
      dto.customerCode?.trim().toUpperCase() ||
      `LEAD-${customerId.replace(/-/g, '').slice(0, 12).toUpperCase()}`;

    try {
      await this.db.insert(customers).values({
        id: customerId,
        organization_id: lead.organization_id,
        category_id: dto.categoryId ?? null,
        code,
        type: dto.customerType ?? 'organization',
        name,
        email: lead.email,
        phone: lead.phone,
        owner_user_id: lead.owner_user_id,
        status: 'active',
        converted_from_lead_id: lead.id,
        created_by: user?.id ?? null,
        updated_by: user?.id ?? null,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Customer code already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid category or owner user reference');
    }

    try {
      await this.db
        .update(leads)
        .set({
          status: 'converted',
          converted_customer_id: customerId,
          updated_at: nowMysqlDateTime(),
          updated_by: user?.id ?? null,
        })
        .where(eq(leads.id, id));
    } catch (error) {
      await this.db
        .update(customers)
        .set({
          deleted_at: nowMysqlDateTime(),
          updated_at: nowMysqlDateTime(),
        })
        .where(eq(customers.id, customerId));
      throw error;
    }

    const [customerRow] = await this.db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    const updatedLead = await this.findOne(id, currentOrganizationId, user);

    return {
      lead: updatedLead,
      customer: toCustomerResponse(customerRow as CustomerRow),
    };
  }

  private assertStatusTransition(
    from: LeadStatus,
    to: LeadPatchStatus,
  ): void {
    if (from === to) return;
    const allowed = STATUS_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Invalid status transition from "${from}" to "${to}"`,
      );
    }
  }

  private async requireLeadAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<LeadRow> {
    const row = await this.findActiveRowById(id);
    assertOrgAccess(row.organization_id, currentOrganizationId, user, 'lead');
    return row;
  }

  private async findActiveRowById(id: string): Promise<LeadRow> {
    const [row] = await this.db
      .select()
      .from(leads)
      .where(and(eq(leads.id, id), isNull(leads.deleted_at)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Lead ${id} not found`);
    }
    return row as LeadRow;
  }

  private async ensureSourceInOrg(
    sourceId: string | null | undefined,
    organizationId: string,
  ): Promise<void> {
    if (!sourceId) return;

    const [row] = await this.db
      .select({ id: lead_sources.id })
      .from(lead_sources)
      .where(
        and(
          eq(lead_sources.id, sourceId),
          eq(lead_sources.organization_id, organizationId),
          isNull(lead_sources.deleted_at),
        ),
      )
      .limit(1);

    if (!row) {
      throw new BadRequestException(
        'sourceId must belong to the same organization',
      );
    }
  }

  private async ensureCategoryInOrg(
    categoryId: string | null | undefined,
    organizationId: string,
  ): Promise<void> {
    if (!categoryId) return;

    const [row] = await this.db
      .select({ id: customer_categories.id })
      .from(customer_categories)
      .where(
        and(
          eq(customer_categories.id, categoryId),
          eq(customer_categories.organization_id, organizationId),
          isNull(customer_categories.deleted_at),
        ),
      )
      .limit(1);

    if (!row) {
      throw new BadRequestException(
        'categoryId must belong to the same organization',
      );
    }
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
    status?: LeadStatus;
    sourceId?: string;
    ownerUserId?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(leads.organization_id, params.organizationId),
      isNull(leads.deleted_at),
    ];
    if (params.search) {
      parts.push(
        or(
          like(leads.company_name, `%${params.search}%`),
          like(leads.contact_name, `%${params.search}%`),
          like(leads.email, `%${params.search}%`),
        )!,
      );
    }
    if (params.status) {
      parts.push(eq(leads.status, params.status));
    }
    if (params.sourceId) {
      parts.push(eq(leads.source_id, params.sourceId));
    }
    if (params.ownerUserId) {
      parts.push(eq(leads.owner_user_id, params.ownerUserId));
    }
    return and(...parts)!;
  }
}
