import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { and, count, eq, isNull, like, or, type SQL } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { parseTtlToSeconds } from '../../../common/utils/parse-ttl';
import type { Env } from '../../../config/env.validation';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  branches,
  organizations,
  user_sessions,
  users,
} from '../../../database/schema';
import { PasswordService } from '../../auth/password.service';
import {
  PASSWORD_RESET_PURPOSE,
  type PasswordResetTokenPayload,
} from '../../auth/auth.types';
import {
  throwDuplicateOrRethrow,
  throwFkOrRethrow,
} from '../../settings/utils/mysql-errors';
import {
  fromBool,
  nowMysqlDateTime,
} from '../../settings/utils/mysql-datetime';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  CreateUserResponseDto,
  ResetPasswordResponseDto,
  UserResponseDto,
} from './dto/user-response.dto';
import { toUserResponse, type UserRow } from './users.mapper';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async findAll(
    query: ListUsersQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<UserResponseDto>> {
    const { page, pageSize, search, branchId, isActive, organizationId } =
      query;
    const scopeOrgId = this.resolveScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const where = this.buildWhere({
      organizationId: scopeOrgId,
      search,
      branchId,
      isActive,
    });
    const offset = (page - 1) * pageSize;

    const listQuery = this.db
      .select({
        id: users.id,
        organization_id: users.organization_id,
        branch_id: users.branch_id,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
        phone: users.phone,
        avatar_url: users.avatar_url,
        is_active: users.is_active,
        last_login_at: users.last_login_at,
        email_verified_at: users.email_verified_at,
        created_at: users.created_at,
        updated_at: users.updated_at,
        deleted_at: users.deleted_at,
      })
      .from(users)
      .$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(users)
      .$dynamic();

    if (where) {
      listQuery.where(where);
      countQuery.where(where);
    }

    const [rows, [totalRow]] = await Promise.all([
      listQuery.orderBy(users.email).limit(pageSize).offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as UserRow[]).map(toUserResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<UserResponseDto> {
    const row = await this.findActiveRowById(id);
    this.assertOrgAccess(row.organization_id, currentOrganizationId, user);
    return toUserResponse(row);
  }

  async create(
    dto: CreateUserDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CreateUserResponseDto> {
    const organizationId = this.requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
    );
    await this.ensureOrganizationExists(organizationId);
    await this.ensureBranchInOrg(dto.branchId, organizationId);

    const id = createId();
    const email = dto.email.trim().toLowerCase();
    const hasInitialPassword = Boolean(dto.password);
    const passwordHash = await this.passwords.hash(
      dto.password ?? randomBytes(32).toString('hex'),
    );

    try {
      await this.db.insert(users).values({
        id,
        organization_id: organizationId,
        branch_id: dto.branchId ?? null,
        email,
        password_hash: passwordHash,
        first_name: dto.firstName,
        last_name: dto.lastName,
        phone: dto.phone ?? null,
        avatar_url: dto.avatarUrl ?? null,
        is_active: fromBool(dto.isActive ?? true),
      });
    } catch (error) {
      throwDuplicateOrRethrow(error, 'Email already exists');
    }

    const created = await this.findOne(id, currentOrganizationId, user);
    if (hasInitialPassword) {
      return created;
    }

    const reset = await this.issuePasswordResetToken(id, organizationId, email);
    return {
      ...created,
      setPasswordToken: reset.setPasswordToken,
      setPasswordExpiresIn: reset.expiresIn,
    };
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<UserResponseDto> {
    const existing = await this.findActiveRowById(id);
    this.assertOrgAccess(existing.organization_id, currentOrganizationId, user);

    if (dto.branchId !== undefined) {
      await this.ensureBranchInOrg(dto.branchId, existing.organization_id);
    }

    const patch: Partial<{
      branch_id: string | null;
      email: string;
      first_name: string;
      last_name: string;
      phone: string | null;
      avatar_url: string | null;
      is_active: number;
      updated_at: string;
    }> = { updated_at: nowMysqlDateTime() };

    if (dto.branchId !== undefined) patch.branch_id = dto.branchId;
    if (dto.email !== undefined) patch.email = dto.email.trim().toLowerCase();
    if (dto.firstName !== undefined) patch.first_name = dto.firstName;
    if (dto.lastName !== undefined) patch.last_name = dto.lastName;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.avatarUrl !== undefined) patch.avatar_url = dto.avatarUrl;
    if (dto.isActive !== undefined) patch.is_active = fromBool(dto.isActive);

    try {
      await this.db.update(users).set(patch).where(eq(users.id, id));
    } catch (error) {
      throwDuplicateOrRethrow(error, 'Email already exists');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    const existing = await this.findActiveRowById(id);
    this.assertOrgAccess(existing.organization_id, currentOrganizationId, user);

    if (user?.id === id) {
      throw new BadRequestException('Cannot delete your own account');
    }

    try {
      await this.db
        .update(users)
        .set({
          deleted_at: nowMysqlDateTime(),
          is_active: 0,
          updated_at: nowMysqlDateTime(),
        })
        .where(eq(users.id, id));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'User is referenced by other records and cannot be deleted',
      );
    }

    await this.revokeAllSessions(id);
  }

  async resetPassword(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<ResetPasswordResponseDto> {
    const existing = await this.findActiveRowById(id);
    this.assertOrgAccess(existing.organization_id, currentOrganizationId, user);

    await this.revokeAllSessions(id);
    return this.issuePasswordResetToken(
      existing.id,
      existing.organization_id,
      existing.email,
    );
  }

  private async issuePasswordResetToken(
    userId: string,
    organizationId: string,
    email: string,
  ): Promise<ResetPasswordResponseDto> {
    const ttl = this.config.get('JWT_PASSWORD_RESET_TTL', { infer: true });
    const expiresIn = parseTtlToSeconds(ttl);
    const payload: PasswordResetTokenPayload = {
      sub: userId,
      organizationId,
      email,
      purpose: PASSWORD_RESET_PURPOSE,
    };

    const setPasswordToken = await this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      expiresIn,
    });

    return { setPasswordToken, expiresIn };
  }

  private async revokeAllSessions(userId: string): Promise<void> {
    await this.db
      .update(user_sessions)
      .set({ revoked_at: nowMysqlDateTime() })
      .where(
        and(eq(user_sessions.user_id, userId), isNull(user_sessions.revoked_at)),
      );
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
        'Cannot create a user in another organization',
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

  private assertOrgAccess(
    organizationId: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): void {
    if (!user || user.isSuperAdmin) {
      return;
    }
    const scope = currentOrganizationId ?? user.organizationId;
    if (scope && scope !== organizationId) {
      throw new ForbiddenException(
        'Cannot access a user in another organization',
      );
    }
  }

  private async findActiveRowById(id: string): Promise<UserRow> {
    const [row] = await this.db
      .select({
        id: users.id,
        organization_id: users.organization_id,
        branch_id: users.branch_id,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
        phone: users.phone,
        avatar_url: users.avatar_url,
        is_active: users.is_active,
        last_login_at: users.last_login_at,
        email_verified_at: users.email_verified_at,
        created_at: users.created_at,
        updated_at: users.updated_at,
        deleted_at: users.deleted_at,
      })
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deleted_at)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return row as UserRow;
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

  private async ensureBranchInOrg(
    branchId: string | null | undefined,
    organizationId: string,
  ): Promise<void> {
    if (!branchId) {
      return;
    }
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

  private buildWhere(params: {
    organizationId?: string;
    search?: string;
    branchId?: string;
    isActive?: boolean;
  }): SQL | undefined {
    const parts: SQL[] = [isNull(users.deleted_at)];

    if (params.organizationId) {
      parts.push(eq(users.organization_id, params.organizationId));
    }
    if (params.branchId) {
      parts.push(eq(users.branch_id, params.branchId));
    }
    if (params.search) {
      parts.push(
        or(
          like(users.email, `%${params.search}%`),
          like(users.first_name, `%${params.search}%`),
          like(users.last_name, `%${params.search}%`),
        )!,
      );
    }
    if (params.isActive !== undefined) {
      parts.push(eq(users.is_active, fromBool(params.isActive)));
    }

    return and(...parts);
  }
}
