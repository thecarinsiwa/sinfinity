import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, isNull, type SQL } from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  branches,
  roles,
  user_roles,
  users,
} from '../../../database/schema';
import {
  throwDuplicateOrRethrow,
  throwFkOrRethrow,
} from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { ListUserRolesQueryDto } from './dto/list-user-roles-query.dto';
import { CreateUserRoleDto, UserRoleResponseDto } from './dto/user-role.dto';

type UserRoleJoined = {
  id: string;
  user_id: string;
  role_id: string;
  branch_id: string | null;
  assigned_at: string;
  assigned_by: string | null;
  role_code: string;
  role_name: string;
};

@Injectable()
export class UserRolesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListUserRolesQueryDto,
    currentOrganizationId?: string,
    actor?: AuthUser,
  ): Promise<PaginatedResponseDto<UserRoleResponseDto>> {
    const { page, pageSize, userId, roleId, branchId } = query;
    const offset = (page - 1) * pageSize;
    const orgId = this.resolveOrgScope(currentOrganizationId, actor);

    if (userId) {
      await this.assertUserInScope(userId, currentOrganizationId, actor);
    }

    const filters: SQL[] = [isNull(roles.deleted_at), isNull(users.deleted_at)];

    if (!actor?.isSuperAdmin) {
      if (!orgId) {
        throw new BadRequestException('organizationId is required');
      }
      filters.push(eq(users.organization_id, orgId));
    } else if (orgId && !userId) {
      filters.push(eq(users.organization_id, orgId));
    }

    if (userId) filters.push(eq(user_roles.user_id, userId));
    if (roleId) filters.push(eq(user_roles.role_id, roleId));
    if (branchId) filters.push(eq(user_roles.branch_id, branchId));

    const where = and(...filters);

    const [rows, [totalRow]] = await Promise.all([
      this.db
        .select({
          id: user_roles.id,
          user_id: user_roles.user_id,
          role_id: user_roles.role_id,
          branch_id: user_roles.branch_id,
          assigned_at: user_roles.assigned_at,
          assigned_by: user_roles.assigned_by,
          role_code: roles.code,
          role_name: roles.name,
        })
        .from(user_roles)
        .innerJoin(roles, eq(user_roles.role_id, roles.id))
        .innerJoin(users, eq(user_roles.user_id, users.id))
        .where(where)
        .orderBy(user_roles.assigned_at)
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(user_roles)
        .innerJoin(roles, eq(user_roles.role_id, roles.id))
        .innerJoin(users, eq(user_roles.user_id, users.id))
        .where(where),
    ]);

    return buildPaginatedResponse(
      (rows as UserRoleJoined[]).map(this.toResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async create(
    dto: CreateUserRoleDto,
    currentOrganizationId?: string,
    actor?: AuthUser,
  ): Promise<UserRoleResponseDto> {
    const targetUser = await this.assertUserInScope(
      dto.userId,
      currentOrganizationId,
      actor,
    );
    const role = await this.findAssignableRole(
      dto.roleId,
      targetUser.organization_id,
      actor,
    );

    if (dto.branchId) {
      await this.ensureBranchInOrg(dto.branchId, targetUser.organization_id);
    }

    const id = createId();
    const assignedAt = nowMysqlDateTime();
    try {
      await this.db.insert(user_roles).values({
        id,
        user_id: dto.userId,
        role_id: dto.roleId,
        branch_id: dto.branchId ?? null,
        assigned_at: assignedAt,
        assigned_by: actor?.id ?? null,
      });
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'User already has this role for the given branch scope',
      );
    }

    return {
      id,
      userId: dto.userId,
      roleId: dto.roleId,
      branchId: dto.branchId ?? null,
      assignedAt,
      assignedBy: actor?.id ?? null,
      roleCode: role.code,
      roleName: role.name,
    };
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    actor?: AuthUser,
  ): Promise<void> {
    const [row] = await this.db
      .select()
      .from(user_roles)
      .where(eq(user_roles.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`User role assignment ${id} not found`);
    }

    await this.assertUserInScope(row.user_id, currentOrganizationId, actor);

    try {
      await this.db.delete(user_roles).where(eq(user_roles.id, id));
    } catch (error) {
      throwFkOrRethrow(error, 'Cannot remove user role assignment');
    }
  }

  private toResponse = (row: UserRoleJoined): UserRoleResponseDto => ({
    id: row.id,
    userId: row.user_id,
    roleId: row.role_id,
    branchId: row.branch_id,
    assignedAt: row.assigned_at,
    assignedBy: row.assigned_by,
    roleCode: row.role_code,
    roleName: row.role_name,
  });

  private resolveOrgScope(
    currentOrganizationId?: string,
    actor?: AuthUser,
  ): string | undefined {
    if (actor?.isSuperAdmin) {
      return currentOrganizationId;
    }
    return currentOrganizationId ?? actor?.organizationId;
  }

  private async assertUserInScope(
    userId: string,
    currentOrganizationId?: string,
    actor?: AuthUser,
  ): Promise<{ id: string; organization_id: string }> {
    const [row] = await this.db
      .select({
        id: users.id,
        organization_id: users.organization_id,
      })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deleted_at)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    if (actor && !actor.isSuperAdmin) {
      const scope = currentOrganizationId ?? actor.organizationId;
      if (scope && scope !== row.organization_id) {
        throw new ForbiddenException(
          'Cannot manage roles for a user in another organization',
        );
      }
    }

    return row;
  }

  private async findAssignableRole(
    roleId: string,
    userOrganizationId: string,
    actor?: AuthUser,
  ): Promise<{ id: string; code: string; name: string }> {
    const [row] = await this.db
      .select({
        id: roles.id,
        code: roles.code,
        name: roles.name,
        organization_id: roles.organization_id,
        is_system: roles.is_system,
      })
      .from(roles)
      .where(and(eq(roles.id, roleId), isNull(roles.deleted_at)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    const isSystem = row.is_system === 1 && row.organization_id === null;
    const isSameOrg = row.organization_id === userOrganizationId;

    if (!isSystem && !isSameOrg) {
      throw new ForbiddenException(
        'Role is not available for this organization',
      );
    }

    if (
      !isSystem &&
      actor &&
      !actor.isSuperAdmin &&
      row.organization_id !== actor.organizationId
    ) {
      throw new ForbiddenException(
        'Cannot assign a role from another organization',
      );
    }

    return row;
  }

  private async ensureBranchInOrg(
    branchId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: branches.id })
      .from(branches)
      .where(
        and(
          eq(branches.id, branchId),
          eq(branches.organization_id, organizationId),
          isNull(branches.deleted_at),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(
        `Branch ${branchId} not found in organization`,
      );
    }
  }
}
