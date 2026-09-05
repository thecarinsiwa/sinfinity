import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import type { AuthUser } from '../../common';
import type { DrizzleDB } from '../../database/database.types';
import { organizations } from '../../database/schema';

export function requireOrgId(
  dtoOrgId: string | undefined,
  currentOrganizationId: string | undefined,
  user: AuthUser | undefined,
  resourceLabel: string,
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
      `Cannot create a ${resourceLabel} in another organization`,
    );
  }
  return organizationId;
}

export function requireScopeOrgId(
  queryOrgId: string | undefined,
  currentOrganizationId: string | undefined,
  user: AuthUser | undefined,
): string {
  if (user?.isSuperAdmin) {
    const organizationId =
      queryOrgId ?? currentOrganizationId ?? user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }
    return organizationId;
  }
  const organizationId =
    currentOrganizationId ?? user?.organizationId ?? queryOrgId;
  if (!organizationId) {
    throw new BadRequestException('organizationId is required');
  }
  if (queryOrgId && queryOrgId !== organizationId) {
    throw new ForbiddenException(
      'Cannot access purchase order data of another organization',
    );
  }
  return organizationId;
}

export function assertOrgAccess(
  organizationId: string,
  currentOrganizationId: string | undefined,
  user: AuthUser | undefined,
  resourceLabel: string,
): void {
  if (!user || user.isSuperAdmin) {
    return;
  }
  const scope = currentOrganizationId ?? user.organizationId;
  if (scope && scope !== organizationId) {
    throw new ForbiddenException(
      `Cannot access a ${resourceLabel} in another organization`,
    );
  }
}

export async function ensureOrganizationExists(
  db: DrizzleDB,
  organizationId: string,
): Promise<void> {
  const [row] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(
      and(
        eq(organizations.id, organizationId),
        isNull(organizations.deleted_at),
      ),
    )
    .limit(1);

  if (!row) {
    throw new NotFoundException(`Organization ${organizationId} not found`);
  }
}
