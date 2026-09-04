import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { DrizzleDB } from '../../database/database.types';
import {
  permissions,
  role_permissions,
  roles,
  user_roles,
} from '../../database/schema';

@Injectable()
export class PermissionsLoader {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async loadForUser(userId: string): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ code: permissions.code })
      .from(user_roles)
      .innerJoin(roles, eq(user_roles.role_id, roles.id))
      .innerJoin(
        role_permissions,
        eq(role_permissions.role_id, roles.id),
      )
      .innerJoin(
        permissions,
        eq(role_permissions.permission_id, permissions.id),
      )
      .where(
        and(eq(user_roles.user_id, userId), isNull(roles.deleted_at)),
      );

    return rows.map((row) => row.code);
  }
}
