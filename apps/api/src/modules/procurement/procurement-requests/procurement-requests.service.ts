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
  or,
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
  opportunities,
  products,
  procurement_request_items,
  procurement_requests,
  sales_orders,
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
} from '../procurement-scope';
import { CreateProcurementRequestDto } from './dto/create-procurement-request.dto';
import { ListProcurementRequestsQueryDto } from './dto/list-procurement-requests-query.dto';
import {
  CreateProcurementRequestItemDto,
  ProcurementRequestItemResponseDto,
  UpdateProcurementRequestItemDto,
} from './dto/procurement-request-item.dto';
import { ProcurementRequestResponseDto } from './dto/procurement-request-response.dto';
import { TransitionProcurementRequestDto } from './dto/transition-procurement-request.dto';
import { UpdateProcurementRequestDto } from './dto/update-procurement-request.dto';
import {
  assertProcurementRequestTransition,
  PROCUREMENT_REQUEST_STATUS,
  type ProcurementRequestPriority,
  type ProcurementRequestStatus,
} from './procurement-request-statuses';
import {
  toProcurementRequestItemResponse,
  toProcurementRequestResponse,
  type ProcurementRequestItemRow,
  type ProcurementRequestRow,
} from './procurement-requests.mapper';

function formatDecimal(value: number, scale = 4): string {
  if (!Number.isFinite(value)) {
    throw new BadRequestException('Invalid decimal value');
  }
  return value.toFixed(scale);
}

@Injectable()
export class ProcurementRequestsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListProcurementRequestsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<ProcurementRequestResponseDto>> {
    const {
      page,
      pageSize,
      search,
      organizationId,
      status,
      priority,
      opportunityId,
      salesOrderId,
      requestedBy,
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
      priority,
      opportunityId,
      salesOrderId,
      requestedBy,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(procurement_requests).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(procurement_requests)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(
          desc(procurement_requests.created_at),
          asc(procurement_requests.id),
        )
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as ProcurementRequestRow[]).map((row) =>
        toProcurementRequestResponse(row),
      ),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProcurementRequestResponseDto> {
    const row = await this.requireRequestAccess(
      id,
      currentOrganizationId,
      user,
    );
    const items = await this.loadItems(id);
    return toProcurementRequestResponse(
      row,
      items.map(toProcurementRequestItemResponse),
    );
  }

  async create(
    dto: CreateProcurementRequestDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProcurementRequestResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'procurement request',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureOpportunityInOrg(dto.opportunityId, organizationId);
    await this.ensureSalesOrderInOrg(dto.salesOrderId, organizationId);

    const id = createId();
    const now = nowMysqlDateTime();

    try {
      await this.db.insert(procurement_requests).values({
        id,
        organization_id: organizationId,
        request_number: dto.requestNumber.trim(),
        title: dto.title.trim(),
        requested_by: dto.requestedBy ?? user?.id ?? null,
        opportunity_id: dto.opportunityId ?? null,
        sales_order_id: dto.salesOrderId ?? null,
        needed_by: dto.neededBy ? dto.neededBy.slice(0, 10) : null,
        status: PROCUREMENT_REQUEST_STATUS.DRAFT,
        priority: dto.priority ?? 'medium',
        notes: dto.notes ?? null,
        created_at: now,
        updated_at: now,
        created_by: user?.id ?? null,
        updated_by: user?.id ?? null,
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Request number already exists for this organization',
        );
      }
      throwFkOrRethrow(
        error,
        'Invalid opportunity, sales order or requester reference',
      );
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
    dto: UpdateProcurementRequestDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProcurementRequestResponseDto> {
    const existing = await this.requireRequestAccess(
      id,
      currentOrganizationId,
      user,
    );
    this.assertHeaderEditable(existing.status);

    if (dto.opportunityId !== undefined) {
      await this.ensureOpportunityInOrg(
        dto.opportunityId,
        existing.organization_id,
      );
    }
    if (dto.salesOrderId !== undefined) {
      await this.ensureSalesOrderInOrg(
        dto.salesOrderId,
        existing.organization_id,
      );
    }

    const patch: Partial<{
      request_number: string;
      title: string;
      requested_by: string | null;
      opportunity_id: string | null;
      sales_order_id: string | null;
      needed_by: string | null;
      priority: ProcurementRequestPriority;
      notes: string | null;
      updated_at: string;
      updated_by: string | null;
    }> = {
      updated_at: nowMysqlDateTime(),
      updated_by: user?.id ?? null,
    };

    if (dto.requestNumber !== undefined)
      patch.request_number = dto.requestNumber.trim();
    if (dto.title !== undefined) patch.title = dto.title.trim();
    if (dto.requestedBy !== undefined) patch.requested_by = dto.requestedBy;
    if (dto.opportunityId !== undefined)
      patch.opportunity_id = dto.opportunityId;
    if (dto.salesOrderId !== undefined) patch.sales_order_id = dto.salesOrderId;
    if (dto.neededBy !== undefined) {
      patch.needed_by =
        dto.neededBy != null ? dto.neededBy.slice(0, 10) : null;
    }
    if (dto.priority !== undefined) patch.priority = dto.priority;
    if (dto.notes !== undefined) patch.notes = dto.notes;

    try {
      await this.db
        .update(procurement_requests)
        .set(patch)
        .where(eq(procurement_requests.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Request number already exists for this organization',
        );
      }
      throwFkOrRethrow(
        error,
        'Invalid opportunity, sales order or requester reference',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireRequestAccess(id, currentOrganizationId, user);
    await this.db
      .update(procurement_requests)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(procurement_requests.id, id));
  }

  async transition(
    id: string,
    dto: TransitionProcurementRequestDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProcurementRequestResponseDto> {
    const request = await this.requireRequestAccess(
      id,
      currentOrganizationId,
      user,
    );
    try {
      assertProcurementRequestTransition(request.status, dto.toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    await this.db
      .update(procurement_requests)
      .set({
        status: dto.toStatus,
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
        ...(dto.notes !== undefined && dto.notes != null && dto.notes !== ''
          ? {
              notes:
                request.notes != null && request.notes !== ''
                  ? `${request.notes}\n${dto.notes}`
                  : dto.notes,
            }
          : {}),
      })
      .where(eq(procurement_requests.id, id));

    return this.findOne(id, currentOrganizationId, user);
  }

  async listItems(
    requestId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProcurementRequestItemResponseDto[]> {
    await this.requireRequestAccess(requestId, currentOrganizationId, user);
    const rows = await this.loadItems(requestId);
    return rows.map(toProcurementRequestItemResponse);
  }

  async addItem(
    requestId: string,
    dto: CreateProcurementRequestItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProcurementRequestItemResponseDto> {
    const request = await this.requireRequestAccess(
      requestId,
      currentOrganizationId,
      user,
    );
    this.assertItemsEditable(request.status);
    const itemId = await this.insertItem(
      requestId,
      request.organization_id,
      dto,
    );
    return this.findItem(requestId, itemId);
  }

  async updateItem(
    requestId: string,
    itemId: string,
    dto: UpdateProcurementRequestItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProcurementRequestItemResponseDto> {
    const request = await this.requireRequestAccess(
      requestId,
      currentOrganizationId,
      user,
    );
    this.assertItemsEditable(request.status);
    const existing = await this.requireItem(requestId, itemId);

    const nextProductId =
      dto.productId !== undefined ? dto.productId : existing.product_id;
    const nextDescription =
      dto.description !== undefined ? dto.description : existing.description;
    this.assertItemHasContent({
      productId: nextProductId,
      description: nextDescription,
    });

    if (dto.productId !== undefined && dto.productId != null) {
      await this.ensureProductInOrg(dto.productId, request.organization_id);
    }

    const patch: Partial<{
      product_id: string | null;
      description: string | null;
      quantity: string;
      unit_id: string | null;
      target_unit_price: string | null;
      currency_id: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.productId !== undefined) patch.product_id = dto.productId;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.quantity !== undefined)
      patch.quantity = formatDecimal(Number(dto.quantity));
    if (dto.unitId !== undefined) patch.unit_id = dto.unitId;
    if (dto.targetUnitPrice !== undefined) {
      patch.target_unit_price =
        dto.targetUnitPrice != null
          ? formatDecimal(Number(dto.targetUnitPrice))
          : null;
    }
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;

    try {
      await this.db
        .update(procurement_request_items)
        .set(patch)
        .where(eq(procurement_request_items.id, itemId));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid product, unit or currency reference',
      );
    }

    return this.findItem(requestId, itemId);
  }

  async removeItem(
    requestId: string,
    itemId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const request = await this.requireRequestAccess(
      requestId,
      currentOrganizationId,
      user,
    );
    this.assertItemsEditable(request.status);
    await this.requireItem(requestId, itemId);
    await this.db
      .delete(procurement_request_items)
      .where(eq(procurement_request_items.id, itemId));
  }

  private async insertItem(
    requestId: string,
    organizationId: string,
    dto: CreateProcurementRequestItemDto,
  ): Promise<string> {
    this.assertItemHasContent(dto);
    if (dto.productId) {
      await this.ensureProductInOrg(dto.productId, organizationId);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(procurement_request_items).values({
        id,
        procurement_request_id: requestId,
        product_id: dto.productId ?? null,
        description: dto.description ?? null,
        quantity: formatDecimal(Number(dto.quantity ?? '1')),
        unit_id: dto.unitId ?? null,
        target_unit_price:
          dto.targetUnitPrice != null
            ? formatDecimal(Number(dto.targetUnitPrice))
            : null,
        currency_id: dto.currencyId ?? null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid product, unit or currency reference',
      );
    }
    return id;
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
    status?: ProcurementRequestStatus;
    priority?: ProcurementRequestPriority;
    opportunityId?: string;
    salesOrderId?: string;
    requestedBy?: string;
  }): SQL {
    const parts: SQL[] = [
      eq(procurement_requests.organization_id, params.organizationId),
      isNull(procurement_requests.deleted_at),
    ];
    if (params.status) {
      parts.push(eq(procurement_requests.status, params.status));
    }
    if (params.priority) {
      parts.push(eq(procurement_requests.priority, params.priority));
    }
    if (params.opportunityId) {
      parts.push(eq(procurement_requests.opportunity_id, params.opportunityId));
    }
    if (params.salesOrderId) {
      parts.push(eq(procurement_requests.sales_order_id, params.salesOrderId));
    }
    if (params.requestedBy) {
      parts.push(eq(procurement_requests.requested_by, params.requestedBy));
    }
    if (params.search?.trim()) {
      const term = `%${params.search.trim()}%`;
      parts.push(
        or(
          like(procurement_requests.request_number, term),
          like(procurement_requests.title, term),
        )!,
      );
    }
    return and(...parts)!;
  }

  private async findItem(
    requestId: string,
    itemId: string,
  ): Promise<ProcurementRequestItemResponseDto> {
    const row = await this.requireItem(requestId, itemId);
    return toProcurementRequestItemResponse(row);
  }

  private async requireItem(
    requestId: string,
    itemId: string,
  ): Promise<ProcurementRequestItemRow> {
    const [row] = await this.db
      .select()
      .from(procurement_request_items)
      .where(
        and(
          eq(procurement_request_items.id, itemId),
          eq(procurement_request_items.procurement_request_id, requestId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Procurement request item ${itemId} not found`,
      );
    }
    return row as ProcurementRequestItemRow;
  }

  private async loadItems(
    requestId: string,
  ): Promise<ProcurementRequestItemRow[]> {
    const rows = await this.db
      .select()
      .from(procurement_request_items)
      .where(eq(procurement_request_items.procurement_request_id, requestId))
      .orderBy(
        asc(procurement_request_items.created_at),
        asc(procurement_request_items.id),
      );
    return rows as ProcurementRequestItemRow[];
  }

  private async requireRequestAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProcurementRequestRow> {
    const [row] = await this.db
      .select()
      .from(procurement_requests)
      .where(
        and(
          eq(procurement_requests.id, id),
          isNull(procurement_requests.deleted_at),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Procurement request ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'procurement request',
    );
    return row as ProcurementRequestRow;
  }

  private assertHeaderEditable(status: ProcurementRequestStatus): void {
    if (
      status === PROCUREMENT_REQUEST_STATUS.CLOSED ||
      status === PROCUREMENT_REQUEST_STATUS.CANCELLED
    ) {
      throw new BadRequestException(
        'Procurement request header cannot be edited while closed or cancelled',
      );
    }
  }

  private assertItemsEditable(status: ProcurementRequestStatus): void {
    if (
      status !== PROCUREMENT_REQUEST_STATUS.DRAFT &&
      status !== PROCUREMENT_REQUEST_STATUS.OPEN
    ) {
      throw new BadRequestException(
        'Procurement request items can only be mutated while draft or open',
      );
    }
  }

  private assertItemHasContent(
    dto: Pick<CreateProcurementRequestItemDto, 'productId' | 'description'>,
  ): void {
    const hasProduct = dto.productId != null && dto.productId !== '';
    const hasDescription =
      dto.description != null && dto.description.trim() !== '';
    if (!hasProduct && !hasDescription) {
      throw new BadRequestException(
        'Item requires at least one of productId or description',
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

  private async ensureSalesOrderInOrg(
    salesOrderId: string | null | undefined,
    organizationId: string,
  ): Promise<void> {
    if (salesOrderId == null) return;
    const [row] = await this.db
      .select({
        id: sales_orders.id,
        organization_id: sales_orders.organization_id,
      })
      .from(sales_orders)
      .where(
        and(
          eq(sales_orders.id, salesOrderId),
          isNull(sales_orders.deleted_at),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Sales order ${salesOrderId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Sales order must belong to the same organization',
      );
    }
  }
}
