import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { createId } from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  permissions,
  role_permissions,
  roles,
} from '../../../database/schema';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  PERMISSION_CATALOG,
  SYSTEM_ROLES,
  resolveRolePermissionCodes,
} from './permissions.catalog';

export type RbacSeedResult = {
  permissionsInserted: number;
  permissionsExisting: number;
  rolesInserted: number;
  rolesExisting: number;
  rolePermissionsSynced: number;
};

@Injectable()
export class RbacSeedService {
  private readonly logger = new Logger(RbacSeedService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /** Idempotent seed of permissions, system roles, and role_permissions. */
  async seed(): Promise<RbacSeedResult> {
    const result: RbacSeedResult = {
      permissionsInserted: 0,
      permissionsExisting: 0,
      rolesInserted: 0,
      rolesExisting: 0,
      rolePermissionsSynced: 0,
    };

    const permissionIdByCode = new Map<string, string>();

    for (const def of PERMISSION_CATALOG) {
      const [existing] = await this.db
        .select({ id: permissions.id })
        .from(permissions)
        .where(eq(permissions.code, def.code))
        .limit(1);

      if (existing) {
        permissionIdByCode.set(def.code, existing.id);
        result.permissionsExisting += 1;
        await this.db
          .update(permissions)
          .set({
            module: def.module,
            action: def.action,
            description: def.description,
            updated_at: nowMysqlDateTime(),
          })
          .where(eq(permissions.id, existing.id));
        continue;
      }

      const id = createId();
      await this.db.insert(permissions).values({
        id,
        module: def.module,
        action: def.action,
        code: def.code,
        description: def.description,
      });
      permissionIdByCode.set(def.code, id);
      result.permissionsInserted += 1;
    }

    for (const roleDef of SYSTEM_ROLES) {
      const [existing] = await this.db
        .select({ id: roles.id })
        .from(roles)
        .where(
          and(
            eq(roles.code, roleDef.code),
            isNull(roles.organization_id),
            eq(roles.is_system, 1),
            isNull(roles.deleted_at),
          ),
        )
        .limit(1);

      let roleId: string;
      if (existing) {
        roleId = existing.id;
        result.rolesExisting += 1;
        await this.db
          .update(roles)
          .set({
            name: roleDef.name,
            description: roleDef.description,
            updated_at: nowMysqlDateTime(),
          })
          .where(eq(roles.id, roleId));
      } else {
        roleId = createId();
        await this.db.insert(roles).values({
          id: roleId,
          organization_id: null,
          code: roleDef.code,
          name: roleDef.name,
          description: roleDef.description,
          is_system: 1,
        });
        result.rolesInserted += 1;
      }

      const codes = resolveRolePermissionCodes(roleDef);
      const desiredIds = codes
        .map((code) => permissionIdByCode.get(code))
        .filter((id): id is string => Boolean(id));

      await this.db
        .delete(role_permissions)
        .where(eq(role_permissions.role_id, roleId));

      if (desiredIds.length > 0) {
        await this.db.insert(role_permissions).values(
          desiredIds.map((permissionId) => ({
            role_id: roleId,
            permission_id: permissionId,
          })),
        );
      }
      result.rolePermissionsSynced += desiredIds.length;
    }

    this.logger.log(
      `RBAC seed done: +${result.permissionsInserted} perms, +${result.rolesInserted} roles, ${result.rolePermissionsSynced} role_permissions`,
    );
    return result;
  }
}
