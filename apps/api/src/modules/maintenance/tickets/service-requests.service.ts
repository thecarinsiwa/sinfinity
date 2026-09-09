import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, isNull, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  customer_contacts,
  customers,
  serial_numbers,
  service_requests,
  support_tickets,
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
} from '../maintenance-scope';
import {
  assertServiceRequestTransition,
  SERVICE_REQUEST_STATUS,
} from '../service-request-statuses';
import { TICKET_PRIORITY, TICKET_STATUS } from '../ticket-statuses';
import {
  ConvertServiceRequestDto,
  ConvertServiceRequestResponseDto,
  CreateServiceRequestDto,
  ListServiceRequestsQueryDto,
  ServiceRequestResponseDto,
  TransitionServiceRequestDto,
  UpdateServiceRequestDto,
} from './dto/service-request.dto';
import {
  toServiceRequestResponse,
  type ServiceRequestRow,
} from './service-requests.mapper';
import { toSupportTicketResponse } from './support-tickets.mapper';

function toMysqlDateTime(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.replace('T', ' ').replace('Z', '').slice(0, 23);
}

@Injectable()
export class ServiceRequestsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListServiceRequestsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<ServiceRequestResponseDto>> {
    const { page, pageSize, organizationId, status, customerId, requestType } =
      query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [eq(service_requests.organization_id, scopeOrgId)];
    if (status) parts.push(eq(service_requests.status, status));
    if (customerId) {
      parts.push(eq(service_requests.customer_id, customerId));
    }
    if (requestType?.trim()) {
      parts.push(eq(service_requests.request_type, requestType.trim()));
    }
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(service_requests).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(service_requests)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(service_requests.created_at), asc(service_requests.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as ServiceRequestRow[]).map(toServiceRequestResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ServiceRequestResponseDto> {
    const row = await this.requireRequestAccess(
      id,
      currentOrganizationId,
      user,
    );
    return toServiceRequestResponse(row);
  }

  async create(
    dto: CreateServiceRequestDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ServiceRequestResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'service request',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureCustomerInOrg(dto.customerId, organizationId);

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(service_requests).values({
        id,
        organization_id: organizationId,
        customer_id: dto.customerId,
        request_type: dto.requestType?.trim() || null,
        description: dto.description ?? null,
        status: SERVICE_REQUEST_STATUS.NEW,
        converted_ticket_id: null,
        requested_at: toMysqlDateTime(dto.requestedAt) ?? now,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid service request reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateServiceRequestDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ServiceRequestResponseDto> {
    const existing = await this.requireRequestAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (
      existing.status === SERVICE_REQUEST_STATUS.COMPLETED ||
      existing.status === SERVICE_REQUEST_STATUS.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot update a service request in status "${existing.status}"`,
      );
    }

    const patch: Partial<{
      request_type: string | null;
      description: string | null;
      requested_at: string;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.requestType !== undefined) {
      patch.request_type = dto.requestType?.trim() || null;
    }
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.requestedAt !== undefined) {
      const value = toMysqlDateTime(dto.requestedAt);
      if (value) patch.requested_at = value;
    }

    await this.db
      .update(service_requests)
      .set(patch)
      .where(eq(service_requests.id, id));

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const existing = await this.requireRequestAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (
      existing.status !== SERVICE_REQUEST_STATUS.NEW &&
      existing.status !== SERVICE_REQUEST_STATUS.CANCELLED
    ) {
      throw new BadRequestException(
        'Only a new or cancelled service request can be deleted',
      );
    }
    await this.db.delete(service_requests).where(eq(service_requests.id, id));
  }

  async transition(
    id: string,
    dto: TransitionServiceRequestDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ServiceRequestResponseDto> {
    const existing = await this.requireRequestAccess(
      id,
      currentOrganizationId,
      user,
    );
    try {
      assertServiceRequestTransition(existing.status, dto.toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    await this.db
      .update(service_requests)
      .set({
        status: dto.toStatus,
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(service_requests.id, id));

    return this.findOne(id, currentOrganizationId, user);
  }

  async convert(
    id: string,
    dto: ConvertServiceRequestDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ConvertServiceRequestResponseDto> {
    const existing = await this.requireRequestAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (existing.converted_ticket_id) {
      throw new ConflictException(
        'Service request is already converted to a ticket',
      );
    }
    if (
      existing.status === SERVICE_REQUEST_STATUS.COMPLETED ||
      existing.status === SERVICE_REQUEST_STATUS.CANCELLED
    ) {
      throw new ConflictException(
        `Cannot convert a service request in status "${existing.status}"`,
      );
    }

    if (dto.contactId) {
      await this.ensureContactInCustomer(dto.contactId, existing.customer_id);
    }
    if (dto.assignedTo) {
      await this.ensureUserInOrg(dto.assignedTo, existing.organization_id);
    }
    if (dto.relatedSerialNumberId) {
      await this.ensureSerialInOrg(
        dto.relatedSerialNumberId,
        existing.organization_id,
      );
    }

    const subject =
      dto.subject?.trim() || existing.request_type?.trim() || 'Service request';
    const ticketId = createId();
    const now = nowMysqlDateTime();

    try {
      await this.db.transaction(async (tx) => {
        await tx.insert(support_tickets).values({
          id: ticketId,
          organization_id: existing.organization_id,
          ticket_number: dto.ticketNumber.trim(),
          customer_id: existing.customer_id,
          contact_id: dto.contactId ?? null,
          subject,
          description: existing.description,
          priority: dto.priority ?? TICKET_PRIORITY.MEDIUM,
          status: TICKET_STATUS.OPEN,
          assigned_to: dto.assignedTo ?? null,
          related_serial_number_id: dto.relatedSerialNumberId ?? null,
          opened_at: now,
          closed_at: null,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        });

        await tx
          .update(service_requests)
          .set({
            status: SERVICE_REQUEST_STATUS.COMPLETED,
            converted_ticket_id: ticketId,
            updated_at: now,
          })
          .where(eq(service_requests.id, id));
      });
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Ticket number already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid convert reference');
    }

    const [requestRow] = await this.db
      .select()
      .from(service_requests)
      .where(eq(service_requests.id, id))
      .limit(1);
    const [ticketRow] = await this.db
      .select()
      .from(support_tickets)
      .where(eq(support_tickets.id, ticketId))
      .limit(1);

    return {
      serviceRequest: toServiceRequestResponse(requestRow),
      ticket: toSupportTicketResponse(ticketRow),
    };
  }

  private async requireRequestAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ServiceRequestRow> {
    const [row] = await this.db
      .select()
      .from(service_requests)
      .where(eq(service_requests.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Service request ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'service request',
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

  private async ensureContactInCustomer(
    contactId: string,
    customerId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: customer_contacts.id,
        customer_id: customer_contacts.customer_id,
      })
      .from(customer_contacts)
      .where(eq(customer_contacts.id, contactId))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Contact ${contactId} not found`);
    }
    if (row.customer_id !== customerId) {
      throw new BadRequestException(
        'Contact must belong to the service request customer',
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
        'Assignee must belong to the same organization',
      );
    }
  }

  private async ensureSerialInOrg(
    serialNumberId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: serial_numbers.id,
        organization_id: serial_numbers.organization_id,
      })
      .from(serial_numbers)
      .where(eq(serial_numbers.id, serialNumberId))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Serial number ${serialNumberId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Serial number must belong to the same organization',
      );
    }
  }
}
