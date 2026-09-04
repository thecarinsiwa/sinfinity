import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  count,
  eq,
  inArray,
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
  organizations,
  permissions,
  role_permissions,
  roles,
} from '../../../database/schema';
import {
  throwDuplicateOrRethrow,
  throwFkOrRethrow,
} from '../../settings/utils/mysql-errors';
import {
  fromBool,
  nowMysqlDateTime,
  toBool,
} from '../../settings/utils/mysql-datetime';
import { CreateRoleDto } from './dto/create-role.dto';
import { ListRolesQueryDto } from './dto/list-roles-query.dto';
import {
  PermissionResponseDto,
  RoleResponseDto,
} from './dto/role-response.dto';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

type RoleRow = {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  description: string | null;
  is_system: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type PermissionRow = {
  id: string;
  module: string;
  action: string;
  code: string;
  description: string | null;
};

@Injectable()
export class RolesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListRolesQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<RoleResponseDto>> {
    const {
      page,
      pageSize,
      search,
      isSystem,
      includeSystem = true,
      organizationId,
    } = query;
    const scopeOrgId = this.resolveScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      search,
      isSystem,
      includeSystem,
      isSuperAdmin: user?.isSuperAdmin === true,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(roles).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(roles)
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery.orderBy(roles.code).limit(pageSize).offset(offset),
      countQuery,
    ]);

    const data = await Promise.all(
      (rows as RoleRow[]).map((row) => this.toRoleResponse(row)),
    );

    return buildPaginatedResponse(
      data,
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<RoleResponseDto> {
    const row = await this.findActiveRowById(id);
    this.assertRoleAccess(row, currentOrganizationId, user);
    return this.toRoleResponse(row);
  }

  async create(
    dto: CreateRoleDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<RoleResponseDto> {
    const organizationId = this.requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
    );
    await this.ensureOrganizationExists(organizationId);

    const id = createId();
    try {
      await this.db.insert(roles).values({
        id,
        organization_id: organizationId,
        code: dto.code.trim().toUpperCase(),
        name: dto.name,
        description: dto.description ?? null,
        is_system: 0,
      });
    } catch (error) {
      throwDuplicateOrRethrow(
        error,
        'Role code already exists for this organization',
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateRoleDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<RoleResponseDto> {
    const existing = await this.findActiveRowById(id);
    this.assertRoleAccess(existing, currentOrganizationId, user);

    if (existing.is_system === 1 && !user?.isSuperAdmin) {
      throw new ForbiddenException('System roles cannot be updated');
    }

    const patch: Partial<{
      name: string;
      description: string | null;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.description !== undefined) patch.description = dto.description;

    await this.db.update(roles).set(patch).where(eq(roles.id, id));
    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const existing = await this.findActiveRowById(id);
    this.assertRoleAccess(existing, currentOrganizationId, user);

    if (existing.is_system === 1) {
      throw new ForbiddenException('System roles cannot be deleted');
    }

    try {
      await this.db
        .update(roles)
        .set({
          deleted_at: nowMysqlDateTime(),
          updated_at: nowMysqlDateTime(),
        })
        .where(eq(roles.id, id));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Role is referenced by other records and cannot be deleted',
      );
    }
  }

  async setPermissions(
    id: string,
    dto: SetRolePermissionsDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<RoleResponseDto> {
    const existing = await this.findActiveRowById(id);
    this.assertRoleAccess(existing, currentOrganizationId, user);

    if (existing.is_system === 1 && !user?.isSuperAdmin) {
      throw new ForbiddenException(
        'Only super-admin can change system role permissions',
      );
    }

    const permissionIds = await this.resolvePermissionIds(dto);

    await this.db
      .delete(role_permissions)
      .where(eq(role_permissions.role_id, id));

    if (permissionIds.length > 0) {
      await this.db.insert(role_permissions).values(
        permissionIds.map((permissionId) => ({
          role_id: id,
          permission_id: permissionId,
        })),
      );
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async addPermission(
    id: string,
    permissionId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<RoleResponseDto> {
    const existing = await this.findActiveRowById(id);
    this.assertRoleAccess(existing, currentOrganizationId, user);

    if (existing.is_system === 1 && !user?.isSuperAdmin) {
      throw new ForbiddenException(
        'Only super-admin can change system role permissions',
      );
    }

    await this.ensurePermissionExists(permissionId);

    try {
      await this.db.insert(role_permissions).values({
        role_id: id,
        permission_id: permissionId,
      });
    } catch (error) {
      throwDuplicateOrRethrow(error, 'Permission already assigned to role');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async removePermission(
    id: string,
    permissionId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<RoleResponseDto> {
    const existing = await this.findActiveRowById(id);
    this.assertRoleAccess(existing, currentOrganizationId, user);

    if (existing.is_system === 1 && !user?.isSuperAdmin) {
      throw new ForbiddenException(
        'Only super-admin can change system role permissions',
      );
    }

    await this.db
      .delete(role_permissions)
      .where(
        and(
          eq(role_permissions.role_id, id),
          eq(role_permissions.permission_id, permissionId),
        ),
      );

    return this.findOne(id, currentOrganizationId, user);
  }

  async listPermissions(): Promise<PermissionResponseDto[]> {
    const rows = await this.db
      .select({
        id: permissions.id,
        module: permissions.module,
        action: permissions.action,
        code: permissions.code,
        description: permissions.description,
      })
      .from(permissions)
      .orderBy(permissions.code);

    return (rows as PermissionRow[]).map(this.toPermissionResponse);
  }

  private async toRoleResponse(row: RoleRow): Promise<RoleResponseDto> {
    const perms = await this.db
      .select({
        id: permissions.id,
        module: permissions.module,
        action: permissions.action,
        code: permissions.code,
        description: permissions.description,
      })
      .from(role_permissions)
      .innerJoin(
        permissions,
        eq(role_permissions.permission_id, permissions.id),
      )
      .where(eq(role_permissions.role_id, row.id))
      .orderBy(permissions.code);

    return {
      id: row.id,
      organizationId: row.organization_id,
      code: row.code,
      name: row.name,
      description: row.description,
      isSystem: toBool(row.is_system),
      permissions: (perms as PermissionRow[]).map(this.toPermissionResponse),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toPermissionResponse = (
    row: PermissionRow,
  ): PermissionResponseDto => ({
    id: row.id,
    module: row.module,
    action: row.action,
    code: row.code,
    description: row.description,
  });

  private async resolvePermissionIds(
    dto: SetRolePermissionsDto,
  ): Promise<string[]> {
    if (dto.permissionIds?.length) {
      const rows = await this.db
        .select({ id: permissions.id })
        .from(permissions)
        .where(inArray(permissions.id, dto.permissionIds));
      if (rows.length !== dto.permissionIds.length) {
        throw new BadRequestException('One or more permission ids are invalid');
      }
      return rows.map((r) => r.id);
    }

    if (dto.permissionCodes?.length) {
      const rows = await this.db
        .select({ id: permissions.id, code: permissions.code })
        .from(permissions)
        .where(inArray(permissions.code, dto.permissionCodes));
      if (rows.length !== dto.permissionCodes.length) {
        throw new BadRequestException(
          'One or more permission codes are invalid',
        );
      }
      return rows.map((r) => r.id);
    }

    throw new BadRequestException(
      'Provide permissionIds or permissionCodes',
    );
  }

  private async ensurePermissionExists(permissionId: string): Promise<void> {
    const [row] = await this.db
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.id, permissionId))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Permission ${permissionId} not found`);
    }
  }

  private requireOrgId(
    dtoOrgId: string | undefined,
    currentOrganizationId: string | undefined,
    user?: AuthUser,
  ): string {
    if (user?.isSuperAdmin && dtoOrgId) {
      return dtoOrgId;
    }
    const organizationId =
      dtoOrgId ?? currentOrganizationId ?? user?.organizationId;
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }
    if (
      user &&
      !user.isSuperAdmin &&
      dtoOrgId &&
      dtoOrgId !== user.organizationId
    ) {
      throw new ForbiddenException(
        'Cannot create a role in another organization',
      );
    }
    return organizationId;
  }

  private resolveScopeOrgId(
    queryOrgId: string | undefined,
    currentOrganizationId: string | undefined,
    user?: AuthUser,
  ): string | undefined {
    if (user?.isSuperAdmin) {
      return queryOrgId ?? currentOrganizationId;
    }
    return currentOrganizationId ?? user?.organizationId ?? queryOrgId;
  }

  private assertRoleAccess(
    row: RoleRow,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): void {
    if (!user || user.isSuperAdmin) {
      return;
    }
    if (row.organization_id === null && row.is_system === 1) {
      return;
    }
    const scope = currentOrganizationId ?? user.organizationId;
    if (scope && row.organization_id && scope !== row.organization_id) {
      throw new ForbiddenException(
        'Cannot access a role in another organization',
      );
    }
  }

  private async findActiveRowById(id: string): Promise<RoleRow> {
    const [row] = await this.db
      .select()
      .from(roles)
      .where(and(eq(roles.id, id), isNull(roles.deleted_at)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Role ${id} not found`);
    }

    return row as RoleRow;
  }

  private async ensureOrganizationExists(organizationId: string): Promise<void> {
    const [row] = await this.db
      .select({ id: organizations.id })
      .from(organizations)
      .where(
        and(eq(organizations.id, organizationId), isNull(organizations.deleted_at)),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }
  }

  private buildWhere(params: {
    organizationId?: string;
    search?: string;
    isSystem?: boolean;
    includeSystem: boolean;
    isSuperAdmin: boolean;
  }): SQL | undefined {
    const parts: SQL[] = [isNull(roles.deleted_at)];

    if (params.isSystem !== undefined) {
      parts.push(eq(roles.is_system, fromBool(params.isSystem)));
    }

    if (params.organizationId) {
      if (params.includeSystem && params.isSystem !== false) {
        parts.push(
          or(
            eq(roles.organization_id, params.organizationId),
            and(isNull(roles.organization_id), eq(roles.is_system, 1)),
          )!,
        );
      } else {
        parts.push(eq(roles.organization_id, params.organizationId));
      }
    } else if (!params.isSuperAdmin) {
      if (params.includeSystem) {
        parts.push(and(isNull(roles.organization_id), eq(roles.is_system, 1))!);
      } else {
        parts.push(eq(roles.is_system, 2));
      }
    }

    if (params.search) {
      parts.push(
        or(
          like(roles.code, `%${params.search}%`),
          like(roles.name, `%${params.search}%`),
        )!,
      );
    }

    return and(...parts);
  }
}
