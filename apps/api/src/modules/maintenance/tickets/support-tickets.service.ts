import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, isNull, like, type SQL } from 'drizzle-orm';
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
  assertTicketTransition,
  isTicketClosedStatus,
  TICKET_PRIORITY,
  TICKET_STATUS,
  type TicketStatus,
} from '../ticket-statuses';
import {
  AssignSupportTicketDto,
  CreateSupportTicketDto,
  ListSupportTicketsQueryDto,
  SupportTicketResponseDto,
  TransitionSupportTicketDto,
  UpdateSupportTicketDto,
} from './dto/support-ticket.dto';
import {
  toSupportTicketResponse,
  type SupportTicketRow,
} from './support-tickets.mapper';

@Injectable()
export class SupportTicketsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListSupportTicketsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<SupportTicketResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      search,
      status,
      priority,
      customerId,
      assignedTo,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [
      eq(support_tickets.organization_id, scopeOrgId),
      isNull(support_tickets.deleted_at),
    ];
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      parts.push(like(support_tickets.ticket_number, term));
    }
    if (status) parts.push(eq(support_tickets.status, status));
    if (priority) parts.push(eq(support_tickets.priority, priority));
    if (customerId) parts.push(eq(support_tickets.customer_id, customerId));
    if (assignedTo) parts.push(eq(support_tickets.assigned_to, assignedTo));
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(support_tickets).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(support_tickets)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(support_tickets.created_at), asc(support_tickets.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as SupportTicketRow[]).map(toSupportTicketResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupportTicketResponseDto> {
    const row = await this.requireTicketAccess(id, currentOrganizationId, user);
    return toSupportTicketResponse(row);
  }

  async create(
    dto: CreateSupportTicketDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupportTicketResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'ticket',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureCustomerInOrg(dto.customerId, organizationId);
    if (dto.contactId) {
      await this.ensureContactInCustomer(dto.contactId, dto.customerId);
    }
    if (dto.assignedTo) {
      await this.ensureUserInOrg(dto.assignedTo, organizationId);
    }
    if (dto.relatedSerialNumberId) {
      await this.ensureSerialInOrg(dto.relatedSerialNumberId, organizationId);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(support_tickets).values({
        id,
        organization_id: organizationId,
        ticket_number: dto.ticketNumber.trim(),
        customer_id: dto.customerId,
        contact_id: dto.contactId ?? null,
        subject: dto.subject.trim(),
        description: dto.description ?? null,
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
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Ticket number already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid ticket reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateSupportTicketDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupportTicketResponseDto> {
    const existing = await this.requireTicketAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (existing.status === TICKET_STATUS.CLOSED) {
      throw new BadRequestException('Cannot update a closed ticket');
    }

    const customerId = dto.customerId ?? existing.customer_id;
    if (dto.customerId) {
      await this.ensureCustomerInOrg(dto.customerId, existing.organization_id);
    }
    if (dto.contactId) {
      await this.ensureContactInCustomer(dto.contactId, customerId);
    }
    if (dto.relatedSerialNumberId) {
      await this.ensureSerialInOrg(
        dto.relatedSerialNumberId,
        existing.organization_id,
      );
    }

    const patch: Partial<{
      ticket_number: string;
      customer_id: string;
      contact_id: string | null;
      subject: string;
      description: string | null;
      priority: typeof existing.priority;
      related_serial_number_id: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.ticketNumber !== undefined) {
      patch.ticket_number = dto.ticketNumber.trim();
    }
    if (dto.customerId !== undefined) patch.customer_id = dto.customerId;
    if (dto.contactId !== undefined) patch.contact_id = dto.contactId;
    if (dto.subject !== undefined) patch.subject = dto.subject.trim();
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.priority !== undefined) patch.priority = dto.priority;
    if (dto.relatedSerialNumberId !== undefined) {
      patch.related_serial_number_id = dto.relatedSerialNumberId;
    }

    try {
      await this.db
        .update(support_tickets)
        .set(patch)
        .where(eq(support_tickets.id, id));
    } catch (error) {
      if (isMysqlDuplicateError(error)) {
        throwDuplicateOrRethrow(
          error,
          'Ticket number already exists for this organization',
        );
      }
      throwFkOrRethrow(error, 'Invalid ticket reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const existing = await this.requireTicketAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (
      existing.status !== TICKET_STATUS.OPEN &&
      existing.status !== TICKET_STATUS.CLOSED
    ) {
      throw new BadRequestException(
        'Only an open or closed ticket can be soft-deleted',
      );
    }
    await this.db
      .update(support_tickets)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(support_tickets.id, id));
  }

  async transition(
    id: string,
    dto: TransitionSupportTicketDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupportTicketResponseDto> {
    const existing = await this.requireTicketAccess(
      id,
      currentOrganizationId,
      user,
    );
    try {
      assertTicketTransition(existing.status, dto.toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    const now = nowMysqlDateTime();
    const patch: Partial<{
      status: TicketStatus;
      closed_at: string | null;
      updated_at: string;
    }> = {
      status: dto.toStatus,
      updated_at: now,
      closed_at: isTicketClosedStatus(dto.toStatus) ? now : null,
    };

    await this.db
      .update(support_tickets)
      .set(patch)
      .where(eq(support_tickets.id, id));

    return this.findOne(id, currentOrganizationId, user);
  }

  async assign(
    id: string,
    dto: AssignSupportTicketDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupportTicketResponseDto> {
    const existing = await this.requireTicketAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (existing.status === TICKET_STATUS.CLOSED) {
      throw new BadRequestException('Cannot assign a closed ticket');
    }
    if (dto.assignedTo) {
      await this.ensureUserInOrg(dto.assignedTo, existing.organization_id);
    }

    await this.db
      .update(support_tickets)
      .set({
        assigned_to: dto.assignedTo ?? null,
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(support_tickets.id, id));

    return this.findOne(id, currentOrganizationId, user);
  }

  private async requireTicketAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<SupportTicketRow> {
    const [row] = await this.db
      .select()
      .from(support_tickets)
      .where(
        and(eq(support_tickets.id, id), isNull(support_tickets.deleted_at)),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }
    assertOrgAccess(row.organization_id, currentOrganizationId, user, 'ticket');
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
        'Contact must belong to the ticket customer',
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
