import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, eq, isNull, like, or, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { technicians, users } from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import {
  fromBool,
  nowMysqlDateTime,
} from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../projects-scope';
import {
  CreateTechnicianDto,
  ListTechniciansQueryDto,
  TechnicianResponseDto,
  UpdateTechnicianDto,
} from './dto/technician.dto';
import { toTechnicianResponse, type TechnicianRow } from './technicians.mapper';

@Injectable()
export class TechniciansService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListTechniciansQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<TechnicianResponseDto>> {
    const { page, pageSize, organizationId, search, isActive } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      search,
      isActive,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(technicians).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(technicians)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(
          asc(technicians.last_name),
          asc(technicians.first_name),
          asc(technicians.id),
        )
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as TechnicianRow[]).map(toTechnicianResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<TechnicianResponseDto> {
    const row = await this.requireTechnicianAccess(
      id,
      currentOrganizationId,
      user,
    );
    return toTechnicianResponse(row);
  }

  async create(
    dto: CreateTechnicianDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<TechnicianResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'technician',
    );
    await ensureOrganizationExists(this.db, organizationId);
    if (dto.userId) {
      await this.ensureUserInOrg(dto.userId, organizationId);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(technicians).values({
        id,
        organization_id: organizationId,
        user_id: dto.userId ?? null,
        first_name: dto.firstName.trim(),
        last_name: dto.lastName.trim(),
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        skills: dto.skills ?? null,
        is_active: fromBool(dto.isActive ?? true),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid technician reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateTechnicianDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<TechnicianResponseDto> {
    const existing = await this.requireTechnicianAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (dto.userId) {
      await this.ensureUserInOrg(dto.userId, existing.organization_id);
    }

    const patch: Partial<{
      user_id: string | null;
      first_name: string;
      last_name: string;
      phone: string | null;
      email: string | null;
      skills: string[] | null;
      is_active: number;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.userId !== undefined) patch.user_id = dto.userId;
    if (dto.firstName !== undefined) {
      patch.first_name = dto.firstName.trim();
    }
    if (dto.lastName !== undefined) patch.last_name = dto.lastName.trim();
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.email !== undefined) patch.email = dto.email;
    if (dto.skills !== undefined) patch.skills = dto.skills;
    if (dto.isActive !== undefined) patch.is_active = fromBool(dto.isActive);

    try {
      await this.db
        .update(technicians)
        .set(patch)
        .where(eq(technicians.id, id));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid technician reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireTechnicianAccess(id, currentOrganizationId, user);
    await this.db
      .update(technicians)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(technicians.id, id));
  }

  private buildWhere(params: {
    organizationId: string;
    search?: string;
    isActive?: boolean;
  }): SQL {
    const parts: SQL[] = [
      eq(technicians.organization_id, params.organizationId),
      isNull(technicians.deleted_at),
    ];
    if (params.isActive !== undefined) {
      parts.push(eq(technicians.is_active, fromBool(params.isActive)));
    }
    if (params.search?.trim()) {
      const term = `%${params.search.trim()}%`;
      parts.push(
        or(
          like(technicians.first_name, term),
          like(technicians.last_name, term),
          like(technicians.email, term),
          like(technicians.phone, term),
        )!,
      );
    }
    return and(...parts)!;
  }

  private async requireTechnicianAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<TechnicianRow> {
    const [row] = await this.db
      .select()
      .from(technicians)
      .where(and(eq(technicians.id, id), isNull(technicians.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Technician ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'technician',
    );
    return row;
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
        'User must belong to the same organization',
      );
    }
  }
}
