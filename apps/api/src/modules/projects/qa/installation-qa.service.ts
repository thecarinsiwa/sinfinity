import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { createId, type AuthUser } from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  commissioning_tests,
  documents,
  installation_reports,
  installations,
  projects,
  technicians,
  users,
} from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { assertOrgAccess } from '../projects-scope';
import type { CommissioningTestResult } from '../commissioning-test-results';
import {
  CommissioningTestResponseDto,
  CreateCommissioningTestDto,
  CreateInstallationReportDto,
  InstallationReportResponseDto,
  UpdateCommissioningTestDto,
  UpdateInstallationReportDto,
} from './dto/installation-qa.dto';
import {
  toCommissioningTestResponse,
  toInstallationReportResponse,
  type CommissioningTestRow,
  type InstallationReportRow,
} from './installation-qa.mapper';

function toMysqlDateTime(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.replace('T', ' ').replace('Z', '').slice(0, 23);
}

@Injectable()
export class InstallationQaService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async listReports(
    projectId: string,
    installationId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InstallationReportResponseDto[]> {
    await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    const rows = await this.db
      .select()
      .from(installation_reports)
      .where(eq(installation_reports.installation_id, installationId))
      .orderBy(
        asc(installation_reports.reported_at),
        asc(installation_reports.id),
      );
    return (rows as InstallationReportRow[]).map(toInstallationReportResponse);
  }

  async findReport(
    projectId: string,
    installationId: string,
    reportId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InstallationReportResponseDto> {
    await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    return this.requireReport(installationId, reportId);
  }

  async createReport(
    projectId: string,
    installationId: string,
    dto: CreateInstallationReportDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InstallationReportResponseDto> {
    const project = await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );

    const authorUserId = dto.authorUserId ?? user?.id ?? null;
    if (authorUserId) {
      await this.ensureUserInOrg(authorUserId, project.organization_id);
    }
    if (dto.documentIds?.length) {
      await this.ensureDocumentsInOrg(dto.documentIds, project.organization_id);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    const reportedAt = toMysqlDateTime(dto.reportedAt) ?? now;
    try {
      await this.db.insert(installation_reports).values({
        id,
        installation_id: installationId,
        author_user_id: authorUserId,
        summary: dto.summary ?? null,
        findings: dto.findings ?? null,
        document_ids: dto.documentIds ?? null,
        reported_at: reportedAt,
        created_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid installation report reference');
    }

    return this.requireReport(installationId, id);
  }

  async updateReport(
    projectId: string,
    installationId: string,
    reportId: string,
    dto: UpdateInstallationReportDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<InstallationReportResponseDto> {
    const project = await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    await this.requireReportRow(installationId, reportId);

    if (dto.documentIds?.length) {
      await this.ensureDocumentsInOrg(dto.documentIds, project.organization_id);
    }

    const patch: Partial<{
      summary: string | null;
      findings: string | null;
      document_ids: string[] | null;
    }> = {};
    if (dto.summary !== undefined) patch.summary = dto.summary;
    if (dto.findings !== undefined) patch.findings = dto.findings;
    if (dto.documentIds !== undefined) patch.document_ids = dto.documentIds;

    if (Object.keys(patch).length === 0) {
      return this.requireReport(installationId, reportId);
    }

    try {
      await this.db
        .update(installation_reports)
        .set(patch)
        .where(eq(installation_reports.id, reportId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid installation report reference');
    }

    return this.requireReport(installationId, reportId);
  }

  async removeReport(
    projectId: string,
    installationId: string,
    reportId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    await this.requireReportRow(installationId, reportId);
    await this.db
      .delete(installation_reports)
      .where(eq(installation_reports.id, reportId));
  }

  async listCommissioningTests(
    projectId: string,
    installationId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CommissioningTestResponseDto[]> {
    await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    const rows = await this.db
      .select()
      .from(commissioning_tests)
      .where(eq(commissioning_tests.installation_id, installationId))
      .orderBy(
        asc(commissioning_tests.created_at),
        asc(commissioning_tests.id),
      );
    return (rows as CommissioningTestRow[]).map(toCommissioningTestResponse);
  }

  async findCommissioningTest(
    projectId: string,
    installationId: string,
    testId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CommissioningTestResponseDto> {
    await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    return this.requireCommissioningTest(installationId, testId);
  }

  async createCommissioningTest(
    projectId: string,
    installationId: string,
    dto: CreateCommissioningTestDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CommissioningTestResponseDto> {
    const project = await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    if (dto.performedBy) {
      await this.ensureTechnicianInOrg(
        dto.performedBy,
        project.organization_id,
      );
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(commissioning_tests).values({
        id,
        installation_id: installationId,
        test_name: dto.testName.trim(),
        checklist: dto.checklist ?? null,
        result: dto.result,
        performed_by: dto.performedBy ?? null,
        performed_at: toMysqlDateTime(dto.performedAt) ?? now,
        notes: dto.notes ?? null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid commissioning test reference');
    }

    return this.requireCommissioningTest(installationId, id);
  }

  async updateCommissioningTest(
    projectId: string,
    installationId: string,
    testId: string,
    dto: UpdateCommissioningTestDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CommissioningTestResponseDto> {
    const project = await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    await this.requireCommissioningTestRow(installationId, testId);

    if (dto.performedBy) {
      await this.ensureTechnicianInOrg(
        dto.performedBy,
        project.organization_id,
      );
    }

    const patch: Partial<{
      test_name: string;
      checklist: Record<string, unknown> | null;
      result: CommissioningTestResult;
      performed_by: string | null;
      performed_at: string | null;
      notes: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.testName !== undefined) patch.test_name = dto.testName.trim();
    if (dto.checklist !== undefined) patch.checklist = dto.checklist;
    if (dto.result !== undefined) patch.result = dto.result;
    if (dto.performedBy !== undefined) patch.performed_by = dto.performedBy;
    if (dto.performedAt !== undefined) {
      patch.performed_at = toMysqlDateTime(dto.performedAt);
    }
    if (dto.notes !== undefined) patch.notes = dto.notes;

    try {
      await this.db
        .update(commissioning_tests)
        .set(patch)
        .where(eq(commissioning_tests.id, testId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid commissioning test reference');
    }

    return this.requireCommissioningTest(installationId, testId);
  }

  async removeCommissioningTest(
    projectId: string,
    installationId: string,
    testId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireInstallationAccess(
      projectId,
      installationId,
      currentOrganizationId,
      user,
    );
    await this.requireCommissioningTestRow(installationId, testId);
    await this.db
      .delete(commissioning_tests)
      .where(eq(commissioning_tests.id, testId));
  }

  private async requireReport(
    installationId: string,
    reportId: string,
  ): Promise<InstallationReportResponseDto> {
    const row = await this.requireReportRow(installationId, reportId);
    return toInstallationReportResponse(row);
  }

  private async requireReportRow(
    installationId: string,
    reportId: string,
  ): Promise<InstallationReportRow> {
    const [row] = await this.db
      .select()
      .from(installation_reports)
      .where(
        and(
          eq(installation_reports.id, reportId),
          eq(installation_reports.installation_id, installationId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Installation report ${reportId} not found on installation ${installationId}`,
      );
    }
    return row;
  }

  private async requireCommissioningTest(
    installationId: string,
    testId: string,
  ): Promise<CommissioningTestResponseDto> {
    const row = await this.requireCommissioningTestRow(installationId, testId);
    return toCommissioningTestResponse(row);
  }

  private async requireCommissioningTestRow(
    installationId: string,
    testId: string,
  ): Promise<CommissioningTestRow> {
    const [row] = await this.db
      .select()
      .from(commissioning_tests)
      .where(
        and(
          eq(commissioning_tests.id, testId),
          eq(commissioning_tests.installation_id, installationId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Commissioning test ${testId} not found on installation ${installationId}`,
      );
    }
    return row;
  }

  private async requireInstallationAccess(
    projectId: string,
    installationId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<{ id: string; organization_id: string }> {
    const [project] = await this.db
      .select({
        id: projects.id,
        organization_id: projects.organization_id,
      })
      .from(projects)
      .where(and(eq(projects.id, projectId), isNull(projects.deleted_at)))
      .limit(1);
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
    assertOrgAccess(
      project.organization_id,
      currentOrganizationId,
      user,
      'project',
    );

    const [installation] = await this.db
      .select({ id: installations.id })
      .from(installations)
      .where(
        and(
          eq(installations.id, installationId),
          eq(installations.project_id, projectId),
        ),
      )
      .limit(1);
    if (!installation) {
      throw new NotFoundException(
        `Installation ${installationId} not found on project ${projectId}`,
      );
    }

    return project;
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
        'Author user must belong to the same organization',
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
