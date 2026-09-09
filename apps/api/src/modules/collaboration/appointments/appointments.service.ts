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
  eq,
  gt,
  gte,
  isNull,
  like,
  lt,
  lte,
  ne,
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
  appointments,
  customers,
  users,
} from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../collaboration-scope';
import {
  APPOINTMENT_STATUS,
  assertAppointmentTransition,
  MEETING_TYPE,
} from '../appointment-statuses';
import {
  CreateAppointmentDto,
  ListAppointmentsQueryDto,
  AppointmentResponseDto,
  TransitionAppointmentDto,
  UpdateAppointmentDto,
} from './dto/appointment.dto';
import {
  appointmentAtToMysql,
  toAppointmentResponse,
  type AppointmentRow,
} from './appointments.mapper';

@Injectable()
export class AppointmentsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListAppointmentsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<AppointmentResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      search,
      status,
      meetingType,
      organizerId,
      customerId,
      startFrom,
      startTo,
      includeDeleted,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [eq(appointments.organization_id, scopeOrgId)];
    if (!includeDeleted) {
      parts.push(isNull(appointments.deleted_at));
    }
    if (search?.trim()) {
      parts.push(like(appointments.title, `%${search.trim()}%`));
    }
    if (status) parts.push(eq(appointments.status, status));
    if (meetingType) parts.push(eq(appointments.meeting_type, meetingType));
    if (organizerId) {
      parts.push(eq(appointments.organizer_id, organizerId));
    }
    if (customerId) {
      parts.push(eq(appointments.customer_id, customerId));
    }
    if (startFrom) {
      parts.push(gte(appointments.start_at, appointmentAtToMysql(startFrom)));
    }
    if (startTo) {
      parts.push(lte(appointments.start_at, appointmentAtToMysql(startTo)));
    }
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(appointments).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(appointments)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(asc(appointments.start_at), asc(appointments.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as AppointmentRow[]).map(toAppointmentResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<AppointmentResponseDto> {
    const row = await this.requireAppointmentAccess(
      id,
      currentOrganizationId,
      user,
    );
    return toAppointmentResponse(row);
  }

  async create(
    dto: CreateAppointmentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<AppointmentResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'appointment',
    );
    await ensureOrganizationExists(this.db, organizationId);

    const startAt = appointmentAtToMysql(dto.startAt);
    const endAt = appointmentAtToMysql(dto.endAt);
    this.assertTimeRange(startAt, endAt);

    const organizerId = dto.organizerId ?? user?.id ?? null;
    if (organizerId) {
      await this.ensureUserInOrg(organizerId, organizationId);
    }
    if (dto.customerId) {
      await this.ensureCustomerInOrg(dto.customerId, organizationId);
    }
    if (organizerId) {
      await this.assertNoOrganizerOverlap(
        organizationId,
        organizerId,
        startAt,
        endAt,
      );
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(appointments).values({
        id,
        organization_id: organizationId,
        title: dto.title.trim(),
        description: dto.description ?? null,
        start_at: startAt,
        end_at: endAt,
        location: dto.location ?? null,
        meeting_type: dto.meetingType ?? MEETING_TYPE.IN_PERSON,
        organizer_id: organizerId,
        customer_id: dto.customerId ?? null,
        status: APPOINTMENT_STATUS.SCHEDULED,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid appointment reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateAppointmentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<AppointmentResponseDto> {
    const existing = await this.requireAppointmentAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (existing.status !== APPOINTMENT_STATUS.SCHEDULED) {
      throw new BadRequestException(
        `Cannot update an appointment in status "${existing.status}"`,
      );
    }

    const startAt =
      dto.startAt !== undefined
        ? appointmentAtToMysql(dto.startAt)
        : existing.start_at;
    const endAt =
      dto.endAt !== undefined
        ? appointmentAtToMysql(dto.endAt)
        : existing.end_at;
    this.assertTimeRange(startAt, endAt);

    const organizerId =
      dto.organizerId !== undefined
        ? dto.organizerId
        : existing.organizer_id;
    if (organizerId) {
      await this.ensureUserInOrg(organizerId, existing.organization_id);
    }
    if (dto.customerId) {
      await this.ensureCustomerInOrg(
        dto.customerId,
        existing.organization_id,
      );
    }

    if (organizerId) {
      await this.assertNoOrganizerOverlap(
        existing.organization_id,
        organizerId,
        startAt,
        endAt,
        id,
      );
    }

    const patch: Partial<{
      title: string;
      description: string | null;
      start_at: string;
      end_at: string;
      location: string | null;
      meeting_type: typeof existing.meeting_type;
      organizer_id: string | null;
      customer_id: string | null;
      updated_at: string;
    }> = {
      updated_at: nowMysqlDateTime(),
    };

    if (dto.title !== undefined) patch.title = dto.title.trim();
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.startAt !== undefined) patch.start_at = startAt;
    if (dto.endAt !== undefined) patch.end_at = endAt;
    if (dto.location !== undefined) patch.location = dto.location;
    if (dto.meetingType !== undefined) patch.meeting_type = dto.meetingType;
    if (dto.organizerId !== undefined) patch.organizer_id = dto.organizerId;
    if (dto.customerId !== undefined) patch.customer_id = dto.customerId;

    try {
      await this.db
        .update(appointments)
        .set(patch)
        .where(eq(appointments.id, id));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid appointment reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireAppointmentAccess(id, currentOrganizationId, user);
    await this.db
      .update(appointments)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(appointments.id, id));
  }

  async transition(
    id: string,
    dto: TransitionAppointmentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<AppointmentResponseDto> {
    const existing = await this.requireAppointmentAccess(
      id,
      currentOrganizationId,
      user,
    );
    try {
      assertAppointmentTransition(existing.status, dto.toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    await this.db
      .update(appointments)
      .set({
        status: dto.toStatus,
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(appointments.id, id));

    return this.findOne(id, currentOrganizationId, user);
  }

  private assertTimeRange(startAt: string, endAt: string): void {
    if (startAt >= endAt) {
      throw new BadRequestException('startAt must be before endAt');
    }
  }

  /**
   * Basic overlap: same organizer, non-cancelled, active row,
   * intervals overlap when start < otherEnd AND end > otherStart.
   */
  private async assertNoOrganizerOverlap(
    organizationId: string,
    organizerId: string,
    startAt: string,
    endAt: string,
    excludeId?: string,
  ): Promise<void> {
    const parts: SQL[] = [
      eq(appointments.organization_id, organizationId),
      eq(appointments.organizer_id, organizerId),
      isNull(appointments.deleted_at),
      ne(appointments.status, APPOINTMENT_STATUS.CANCELLED),
      lt(appointments.start_at, endAt),
      gt(appointments.end_at, startAt),
    ];
    if (excludeId) {
      parts.push(ne(appointments.id, excludeId));
    }

    const [overlap] = await this.db
      .select({ id: appointments.id, title: appointments.title })
      .from(appointments)
      .where(and(...parts))
      .limit(1);

    if (overlap) {
      throw new ConflictException(
        `Organizer already has an overlapping appointment (${overlap.title})`,
      );
    }
  }

  private async requireAppointmentAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<AppointmentRow> {
    const [row] = await this.db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'appointment',
    );
    return row as AppointmentRow;
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
        'Organizer must belong to the same organization',
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
}
