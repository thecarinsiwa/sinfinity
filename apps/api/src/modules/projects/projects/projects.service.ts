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
  customers,
  products,
  project_items,
  projects,
  sales_orders,
  services,
  users,
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
} from '../projects-scope';
import {
  assertProjectTransition,
  PROJECT_STATUS,
  type ProjectStatus,
} from '../project-statuses';
import {
  CreateProjectDto,
  CreateProjectItemDto,
  ListProjectsQueryDto,
  ProjectItemResponseDto,
  ProjectResponseDto,
  TransitionProjectDto,
  UpdateProjectDto,
  UpdateProjectItemDto,
} from './dto/project.dto';
import {
  toProjectItemResponse,
  toProjectResponse,
  type ProjectItemRow,
  type ProjectRow,
} from './projects.mapper';

function toDateOnly(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.slice(0, 10);
}

@Injectable()
export class ProjectsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListProjectsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<ProjectResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      search,
      status,
      customerId,
      salesOrderId,
      includeDeleted,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [eq(projects.organization_id, scopeOrgId)];
    if (!includeDeleted) {
      parts.push(isNull(projects.deleted_at));
    }
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      parts.push(
        or(like(projects.project_number, term), like(projects.name, term))!,
      );
    }
    if (status) parts.push(eq(projects.status, status));
    if (customerId) parts.push(eq(projects.customer_id, customerId));
    if (salesOrderId) {
      parts.push(eq(projects.sales_order_id, salesOrderId));
    }
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(projects).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(projects)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(projects.created_at), asc(projects.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as ProjectRow[]).map((row) => toProjectResponse(row)),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProjectResponseDto> {
    const row = await this.requireProjectAccess(
      id,
      currentOrganizationId,
      user,
    );
    const items = await this.loadItems(id);
    return toProjectResponse(row, items);
  }

  async create(
    dto: CreateProjectDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProjectResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'project',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureCustomerInOrg(dto.customerId, organizationId);
    if (dto.salesOrderId) {
      await this.ensureSalesOrderLinkable(
        dto.salesOrderId,
        organizationId,
        dto.customerId,
      );
    }
    if (dto.managerUserId) {
      await this.ensureUserInOrg(dto.managerUserId, organizationId);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(projects).values({
        id,
        organization_id: organizationId,
        project_number: dto.projectNumber.trim(),
        name: dto.name.trim(),
        customer_id: dto.customerId,
        sales_order_id: dto.salesOrderId ?? null,
        manager_user_id: dto.managerUserId ?? null,
        start_date: toDateOnly(dto.startDate),
        end_date: toDateOnly(dto.endDate),
        status: PROJECT_STATUS.PLANNED,
        site_address: dto.siteAddress ?? null,
        description: dto.description ?? null,
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
          'Project number already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid project reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProjectResponseDto> {
    const existing = await this.requireProjectAccess(
      id,
      currentOrganizationId,
      user,
    );
    this.assertMutable(existing.status);

    const customerId = dto.customerId ?? existing.customer_id;
    if (dto.customerId !== undefined) {
      await this.ensureCustomerInOrg(dto.customerId, existing.organization_id);
    }
    if (dto.salesOrderId) {
      await this.ensureSalesOrderLinkable(
        dto.salesOrderId,
        existing.organization_id,
        customerId,
      );
    }
    if (dto.managerUserId) {
      await this.ensureUserInOrg(dto.managerUserId, existing.organization_id);
    }

    const patch: Partial<{
      project_number: string;
      name: string;
      customer_id: string;
      sales_order_id: string | null;
      manager_user_id: string | null;
      start_date: string | null;
      end_date: string | null;
      site_address: string | null;
      description: string | null;
      updated_at: string;
      updated_by: string | null;
    }> = {
      updated_at: nowMysqlDateTime(),
      updated_by: user?.id ?? null,
    };

    if (dto.projectNumber !== undefined) {
      patch.project_number = dto.projectNumber.trim();
    }
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.customerId !== undefined) patch.customer_id = dto.customerId;
    if (dto.salesOrderId !== undefined) {
      patch.sales_order_id = dto.salesOrderId;
    }
    if (dto.managerUserId !== undefined) {
      patch.manager_user_id = dto.managerUserId;
    }
    if (dto.startDate !== undefined) {
      patch.start_date = toDateOnly(dto.startDate);
    }
    if (dto.endDate !== undefined) {
      patch.end_date = toDateOnly(dto.endDate);
    }
    if (dto.siteAddress !== undefined) patch.site_address = dto.siteAddress;
    if (dto.description !== undefined) patch.description = dto.description;

    try {
      await this.db.update(projects).set(patch).where(eq(projects.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Project number already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid project reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const existing = await this.requireProjectAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (
      existing.status !== PROJECT_STATUS.PLANNED &&
      existing.status !== PROJECT_STATUS.CANCELLED
    ) {
      throw new BadRequestException(
        'Only a planned or cancelled project can be soft-deleted',
      );
    }
    await this.db
      .update(projects)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(projects.id, id));
  }

  async transition(
    id: string,
    dto: TransitionProjectDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProjectResponseDto> {
    const existing = await this.requireProjectAccess(
      id,
      currentOrganizationId,
      user,
    );
    try {
      assertProjectTransition(existing.status, dto.toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    await this.db
      .update(projects)
      .set({
        status: dto.toStatus,
        updated_at: nowMysqlDateTime(),
        updated_by: user?.id ?? null,
      })
      .where(eq(projects.id, id));

    return this.findOne(id, currentOrganizationId, user);
  }

  async listItems(
    projectId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProjectItemResponseDto[]> {
    await this.requireProjectAccess(projectId, currentOrganizationId, user);
    const items = await this.loadItems(projectId);
    return items.map(toProjectItemResponse);
  }

  async createItem(
    projectId: string,
    dto: CreateProjectItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProjectItemResponseDto> {
    const project = await this.requireProjectAccess(
      projectId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(project.status);
    this.assertItemRefs(dto.productId, dto.serviceId);
    if (dto.productId) {
      await this.ensureProductInOrg(dto.productId, project.organization_id);
    }
    if (dto.serviceId) {
      await this.ensureServiceInOrg(dto.serviceId, project.organization_id);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(project_items).values({
        id,
        project_id: projectId,
        product_id: dto.productId ?? null,
        service_id: dto.serviceId ?? null,
        quantity: dto.quantity,
        description: dto.description ?? null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid project item reference');
    }

    return this.requireItem(projectId, id);
  }

  async updateItem(
    projectId: string,
    itemId: string,
    dto: UpdateProjectItemDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProjectItemResponseDto> {
    const project = await this.requireProjectAccess(
      projectId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(project.status);
    const existing = await this.requireItemRow(projectId, itemId);

    const productId =
      dto.productId !== undefined ? dto.productId : existing.product_id;
    const serviceId =
      dto.serviceId !== undefined ? dto.serviceId : existing.service_id;
    this.assertItemRefs(productId, serviceId);

    if (dto.productId) {
      await this.ensureProductInOrg(dto.productId, project.organization_id);
    }
    if (dto.serviceId) {
      await this.ensureServiceInOrg(dto.serviceId, project.organization_id);
    }

    const patch: Partial<{
      product_id: string | null;
      service_id: string | null;
      quantity: string;
      description: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.productId !== undefined) patch.product_id = dto.productId;
    if (dto.serviceId !== undefined) patch.service_id = dto.serviceId;
    if (dto.quantity !== undefined) patch.quantity = dto.quantity;
    if (dto.description !== undefined) patch.description = dto.description;

    try {
      await this.db
        .update(project_items)
        .set(patch)
        .where(eq(project_items.id, itemId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid project item reference');
    }

    return this.requireItem(projectId, itemId);
  }

  async removeItem(
    projectId: string,
    itemId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const project = await this.requireProjectAccess(
      projectId,
      currentOrganizationId,
      user,
    );
    this.assertMutable(project.status);
    await this.requireItemRow(projectId, itemId);
    await this.db.delete(project_items).where(eq(project_items.id, itemId));
  }

  private assertMutable(status: ProjectStatus): void {
    if (
      status === PROJECT_STATUS.COMPLETED ||
      status === PROJECT_STATUS.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot modify a project in status "${status}"`,
      );
    }
  }

  private assertItemRefs(
    productId: string | null | undefined,
    serviceId: string | null | undefined,
  ): void {
    if (!productId && !serviceId) {
      throw new BadRequestException(
        'At least one of productId or serviceId is required',
      );
    }
  }

  private async loadItems(projectId: string): Promise<ProjectItemRow[]> {
    const rows = await this.db
      .select()
      .from(project_items)
      .where(eq(project_items.project_id, projectId))
      .orderBy(asc(project_items.created_at), asc(project_items.id));
    return rows;
  }

  private async requireItem(
    projectId: string,
    itemId: string,
  ): Promise<ProjectItemResponseDto> {
    const row = await this.requireItemRow(projectId, itemId);
    return toProjectItemResponse(row);
  }

  private async requireItemRow(
    projectId: string,
    itemId: string,
  ): Promise<ProjectItemRow> {
    const [row] = await this.db
      .select()
      .from(project_items)
      .where(
        and(
          eq(project_items.id, itemId),
          eq(project_items.project_id, projectId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Project item ${itemId} not found on project ${projectId}`,
      );
    }
    return row;
  }

  private async requireProjectAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ProjectRow> {
    const [row] = await this.db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), isNull(projects.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'project',
    );
    return row;
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

  private async ensureSalesOrderLinkable(
    salesOrderId: string,
    organizationId: string,
    customerId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: sales_orders.id,
        organization_id: sales_orders.organization_id,
        customer_id: sales_orders.customer_id,
      })
      .from(sales_orders)
      .where(
        and(eq(sales_orders.id, salesOrderId), isNull(sales_orders.deleted_at)),
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
    if (row.customer_id !== customerId) {
      throw new BadRequestException(
        'Sales order customer must match the project customer',
      );
    }
  }

  private async ensureUserInOrg(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: users.id, organization_id: users.organization_id })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Manager user must belong to the same organization',
      );
    }
  }

  private async ensureProductInOrg(
    productId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: products.id, organization_id: products.organization_id })
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

  private async ensureServiceInOrg(
    serviceId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: services.id, organization_id: services.organization_id })
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
