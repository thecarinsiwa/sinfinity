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
  inArray,
  isNull,
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
  documents,
  maintenance_contracts,
  maintenance_interventions,
  maintenance_reports,
  maintenance_schedules,
  support_tickets,
  technicians,
} from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../maintenance-scope';
import {
  assertInterventionTransition,
  INTERVENTION_STATUS,
  INTERVENTION_TYPE,
  type InterventionStatus,
  type InterventionType,
} from '../intervention-statuses';
import {
  CreateMaintenanceInterventionDto,
  CreateMaintenanceReportDto,
  ListMaintenanceInterventionsQueryDto,
  MaintenanceInterventionResponseDto,
  MaintenanceReportResponseDto,
  TransitionMaintenanceInterventionDto,
  UpdateMaintenanceInterventionDto,
  UpdateMaintenanceReportDto,
} from './dto/maintenance-intervention.dto';
import {
  toMaintenanceInterventionResponse,
  toMaintenanceReportResponse,
  type MaintenanceInterventionRow,
  type MaintenanceReportRow,
} from './maintenance-interventions.mapper';

function toMysqlDateTime(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.replace('T', ' ').replace('Z', '').slice(0, 23);
}

@Injectable()
export class MaintenanceInterventionsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListMaintenanceInterventionsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<MaintenanceInterventionResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      status,
      interventionType,
      customerId,
      ticketId,
      contractId,
      scheduleId,
      technicianId,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [
      eq(maintenance_interventions.organization_id, scopeOrgId),
    ];
    if (status) parts.push(eq(maintenance_interventions.status, status));
    if (interventionType) {
      parts.push(
        eq(maintenance_interventions.intervention_type, interventionType),
      );
    }
    if (customerId) {
      parts.push(eq(maintenance_interventions.customer_id, customerId));
    }
    if (ticketId) {
      parts.push(eq(maintenance_interventions.ticket_id, ticketId));
    }
    if (contractId) {
      parts.push(eq(maintenance_interventions.contract_id, contractId));
    }
    if (scheduleId) {
      parts.push(eq(maintenance_interventions.schedule_id, scheduleId));
    }
    if (technicianId) {
      parts.push(eq(maintenance_interventions.technician_id, technicianId));
    }
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db
      .select()
      .from(maintenance_interventions)
      .$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(maintenance_interventions)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(
          desc(maintenance_interventions.created_at),
          asc(maintenance_interventions.id),
        )
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as MaintenanceInterventionRow[]).map((row) =>
        toMaintenanceInterventionResponse(row),
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
  ): Promise<MaintenanceInterventionResponseDto> {
    const row = await this.requireInterventionAccess(
      id,
      currentOrganizationId,
      user,
    );
    const reports = await this.loadReports(id);
    return toMaintenanceInterventionResponse(row, reports);
  }

  async create(
    dto: CreateMaintenanceInterventionDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<MaintenanceInterventionResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'intervention',
    );
    await ensureOrganizationExists(this.db, organizationId);
    await this.ensureCustomerInOrg(dto.customerId, organizationId);

    const links = await this.resolveLinks({
      organizationId,
      customerId: dto.customerId,
      ticketId: dto.ticketId ?? null,
      contractId: dto.contractId ?? null,
      scheduleId: dto.scheduleId ?? null,
    });

    if (dto.technicianId) {
      await this.ensureTechnicianInOrg(dto.technicianId, organizationId);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(maintenance_interventions).values({
        id,
        organization_id: organizationId,
        ticket_id: links.ticketId,
        schedule_id: links.scheduleId,
        contract_id: links.contractId,
        customer_id: dto.customerId,
        technician_id: dto.technicianId ?? null,
        started_at: toMysqlDateTime(dto.startedAt),
        ended_at: null,
        intervention_type: dto.interventionType ?? INTERVENTION_TYPE.CORRECTIVE,
        status: INTERVENTION_STATUS.PLANNED,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid intervention reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateMaintenanceInterventionDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<MaintenanceInterventionResponseDto> {
    const existing = await this.requireInterventionAccess(
      id,
      currentOrganizationId,
      user,
    );
    this.assertMutable(existing.status);

    const links = await this.resolveLinks({
      organizationId: existing.organization_id,
      customerId: existing.customer_id,
      ticketId: dto.ticketId !== undefined ? dto.ticketId : existing.ticket_id,
      contractId:
        dto.contractId !== undefined ? dto.contractId : existing.contract_id,
      scheduleId:
        dto.scheduleId !== undefined ? dto.scheduleId : existing.schedule_id,
    });

    if (dto.technicianId) {
      await this.ensureTechnicianInOrg(
        dto.technicianId,
        existing.organization_id,
      );
    }

    const patch: Partial<{
      ticket_id: string | null;
      schedule_id: string | null;
      contract_id: string | null;
      technician_id: string | null;
      intervention_type: InterventionType;
      started_at: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (
      dto.ticketId !== undefined ||
      dto.contractId !== undefined ||
      dto.scheduleId !== undefined
    ) {
      patch.ticket_id = links.ticketId;
      patch.contract_id = links.contractId;
      patch.schedule_id = links.scheduleId;
    }
    if (dto.technicianId !== undefined) {
      patch.technician_id = dto.technicianId;
    }
    if (dto.interventionType !== undefined) {
      patch.intervention_type = dto.interventionType;
    }
    if (dto.startedAt !== undefined) {
      patch.started_at = toMysqlDateTime(dto.startedAt);
    }

    try {
      await this.db
        .update(maintenance_interventions)
        .set(patch)
        .where(eq(maintenance_interventions.id, id));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid intervention reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const existing = await this.requireInterventionAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (
      existing.status !== INTERVENTION_STATUS.PLANNED &&
      existing.status !== INTERVENTION_STATUS.CANCELLED
    ) {
      throw new BadRequestException(
        'Only a planned or cancelled intervention can be deleted',
      );
    }
    await this.db
      .delete(maintenance_interventions)
      .where(eq(maintenance_interventions.id, id));
  }

  async transition(
    id: string,
    dto: TransitionMaintenanceInterventionDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<MaintenanceInterventionResponseDto> {
    const existing = await this.requireInterventionAccess(
      id,
      currentOrganizationId,
      user,
    );
    try {
      assertInterventionTransition(existing.status, dto.toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    const now = nowMysqlDateTime();
    const patch: Partial<{
      status: InterventionStatus;
      ended_at: string | null;
      updated_at: string;
    }> = {
      status: dto.toStatus,
      updated_at: now,
    };
    if (dto.toStatus === INTERVENTION_STATUS.DONE) {
      patch.ended_at = now;
    }

    await this.db
      .update(maintenance_interventions)
      .set(patch)
      .where(eq(maintenance_interventions.id, id));

    return this.findOne(id, currentOrganizationId, user);
  }

  async listReports(
    interventionId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<MaintenanceReportResponseDto[]> {
    await this.requireInterventionAccess(
      interventionId,
      currentOrganizationId,
      user,
    );
    const reports = await this.loadReports(interventionId);
    return reports.map(toMaintenanceReportResponse);
  }

  async findReport(
    interventionId: string,
    reportId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<MaintenanceReportResponseDto> {
    await this.requireInterventionAccess(
      interventionId,
      currentOrganizationId,
      user,
    );
    return this.requireReport(interventionId, reportId);
  }

  async createReport(
    interventionId: string,
    dto: CreateMaintenanceReportDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<MaintenanceReportResponseDto> {
    const intervention = await this.requireInterventionAccess(
      interventionId,
      currentOrganizationId,
      user,
    );
    if (intervention.status === INTERVENTION_STATUS.CANCELLED) {
      throw new BadRequestException(
        'Cannot add reports to a cancelled intervention',
      );
    }
    if (dto.documentIds?.length) {
      await this.ensureDocumentsInOrg(
        dto.documentIds,
        intervention.organization_id,
      );
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(maintenance_reports).values({
        id,
        intervention_id: interventionId,
        summary: dto.summary ?? null,
        actions_taken: dto.actionsTaken ?? null,
        parts_used: dto.partsUsed ?? null,
        document_ids: dto.documentIds ?? null,
        reported_at: toMysqlDateTime(dto.reportedAt) ?? now,
        created_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid maintenance report reference');
    }

    return this.requireReport(interventionId, id);
  }

  async updateReport(
    interventionId: string,
    reportId: string,
    dto: UpdateMaintenanceReportDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<MaintenanceReportResponseDto> {
    const intervention = await this.requireInterventionAccess(
      interventionId,
      currentOrganizationId,
      user,
    );
    if (intervention.status === INTERVENTION_STATUS.CANCELLED) {
      throw new BadRequestException(
        'Cannot update reports on a cancelled intervention',
      );
    }
    await this.requireReportRow(interventionId, reportId);

    if (dto.documentIds?.length) {
      await this.ensureDocumentsInOrg(
        dto.documentIds,
        intervention.organization_id,
      );
    }

    const patch: Partial<{
      summary: string | null;
      actions_taken: string | null;
      parts_used: Record<string, unknown> | unknown[] | null;
      document_ids: string[] | null;
    }> = {};
    if (dto.summary !== undefined) patch.summary = dto.summary;
    if (dto.actionsTaken !== undefined) patch.actions_taken = dto.actionsTaken;
    if (dto.partsUsed !== undefined) patch.parts_used = dto.partsUsed;
    if (dto.documentIds !== undefined) patch.document_ids = dto.documentIds;

    if (Object.keys(patch).length === 0) {
      return this.requireReport(interventionId, reportId);
    }

    try {
      await this.db
        .update(maintenance_reports)
        .set(patch)
        .where(eq(maintenance_reports.id, reportId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid maintenance report reference');
    }

    return this.requireReport(interventionId, reportId);
  }

  async removeReport(
    interventionId: string,
    reportId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const intervention = await this.requireInterventionAccess(
      interventionId,
      currentOrganizationId,
      user,
    );
    if (intervention.status === INTERVENTION_STATUS.CANCELLED) {
      throw new BadRequestException(
        'Cannot delete reports on a cancelled intervention',
      );
    }
    await this.requireReportRow(interventionId, reportId);
    await this.db
      .delete(maintenance_reports)
      .where(eq(maintenance_reports.id, reportId));
  }

  private assertMutable(status: InterventionStatus): void {
    if (
      status === INTERVENTION_STATUS.DONE ||
      status === INTERVENTION_STATUS.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot modify an intervention in status "${status}"`,
      );
    }
  }

  private async resolveLinks(params: {
    organizationId: string;
    customerId: string;
    ticketId: string | null;
    contractId: string | null;
    scheduleId: string | null;
  }): Promise<{
    ticketId: string | null;
    contractId: string | null;
    scheduleId: string | null;
  }> {
    let contractId = params.contractId;
    const scheduleId = params.scheduleId;
    const ticketId = params.ticketId;

    if (ticketId) {
      const ticket = await this.requireTicketInOrg(
        ticketId,
        params.organizationId,
      );
      if (ticket.customer_id !== params.customerId) {
        throw new BadRequestException(
          'Ticket customer must match the intervention customer',
        );
      }
    }

    if (scheduleId) {
      const schedule = await this.requireSchedule(scheduleId);
      const scheduleContract = await this.requireContractInOrg(
        schedule.maintenance_contract_id,
        params.organizationId,
      );
      if (scheduleContract.customer_id !== params.customerId) {
        throw new BadRequestException(
          'Schedule contract customer must match the intervention customer',
        );
      }
      if (contractId && contractId !== schedule.maintenance_contract_id) {
        throw new BadRequestException(
          'scheduleId must belong to the provided contractId',
        );
      }
      contractId = schedule.maintenance_contract_id;
    }

    if (contractId) {
      const contract = await this.requireContractInOrg(
        contractId,
        params.organizationId,
      );
      if (contract.customer_id !== params.customerId) {
        throw new BadRequestException(
          'Contract customer must match the intervention customer',
        );
      }
    }

    return { ticketId, contractId, scheduleId };
  }

  private async loadReports(
    interventionId: string,
  ): Promise<MaintenanceReportRow[]> {
    const rows = await this.db
      .select()
      .from(maintenance_reports)
      .where(eq(maintenance_reports.intervention_id, interventionId))
      .orderBy(
        asc(maintenance_reports.reported_at),
        asc(maintenance_reports.id),
      );
    return rows;
  }

  private async requireReport(
    interventionId: string,
    reportId: string,
  ): Promise<MaintenanceReportResponseDto> {
    const row = await this.requireReportRow(interventionId, reportId);
    return toMaintenanceReportResponse(row);
  }

  private async requireReportRow(
    interventionId: string,
    reportId: string,
  ): Promise<MaintenanceReportRow> {
    const [row] = await this.db
      .select()
      .from(maintenance_reports)
      .where(
        and(
          eq(maintenance_reports.id, reportId),
          eq(maintenance_reports.intervention_id, interventionId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Report ${reportId} not found on intervention ${interventionId}`,
      );
    }
    return row;
  }

  private async requireInterventionAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<MaintenanceInterventionRow> {
    const [row] = await this.db
      .select()
      .from(maintenance_interventions)
      .where(eq(maintenance_interventions.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Intervention ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'intervention',
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

  private async ensureTechnicianInOrg(
    technicianId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: technicians.id,
        organization_id: technicians.organization_id,
      })
      .from(technicians)
      .where(
        and(eq(technicians.id, technicianId), isNull(technicians.deleted_at)),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Technician ${technicianId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Technician must belong to the same organization',
      );
    }
  }

  private async requireTicketInOrg(
    ticketId: string,
    organizationId: string,
  ): Promise<{ id: string; customer_id: string }> {
    const [row] = await this.db
      .select({
        id: support_tickets.id,
        customer_id: support_tickets.customer_id,
        organization_id: support_tickets.organization_id,
      })
      .from(support_tickets)
      .where(
        and(
          eq(support_tickets.id, ticketId),
          isNull(support_tickets.deleted_at),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Ticket must belong to the same organization',
      );
    }
    return row;
  }

  private async requireContractInOrg(
    contractId: string,
    organizationId: string,
  ): Promise<{ id: string; customer_id: string }> {
    const [row] = await this.db
      .select({
        id: maintenance_contracts.id,
        customer_id: maintenance_contracts.customer_id,
        organization_id: maintenance_contracts.organization_id,
      })
      .from(maintenance_contracts)
      .where(
        and(
          eq(maintenance_contracts.id, contractId),
          isNull(maintenance_contracts.deleted_at),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Maintenance contract ${contractId} not found`,
      );
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Contract must belong to the same organization',
      );
    }
    return row;
  }

  private async requireSchedule(
    scheduleId: string,
  ): Promise<{ id: string; maintenance_contract_id: string }> {
    const [row] = await this.db
      .select({
        id: maintenance_schedules.id,
        maintenance_contract_id: maintenance_schedules.maintenance_contract_id,
      })
      .from(maintenance_schedules)
      .where(eq(maintenance_schedules.id, scheduleId))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Schedule ${scheduleId} not found`);
    }
    return row;
  }

  private async ensureDocumentsInOrg(
    documentIds: string[],
    organizationId: string,
  ): Promise<void> {
    const uniqueIds = [...new Set(documentIds)];
    const rows = await this.db
      .select({
        id: documents.id,
        organization_id: documents.organization_id,
        deleted_at: documents.deleted_at,
        status: documents.status,
      })
      .from(documents)
      .where(inArray(documents.id, uniqueIds));

    const byId = new Map(rows.map((row) => [row.id, row]));
    for (const documentId of uniqueIds) {
      const row = byId.get(documentId);
      if (!row || row.deleted_at != null || row.status === 'deleted') {
        throw new NotFoundException(`Document ${documentId} not found`);
      }
      if (row.organization_id !== organizationId) {
        throw new BadRequestException(
          'Document must belong to the same organization',
        );
      }
    }
  }
}
