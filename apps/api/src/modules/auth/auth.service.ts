import {
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { and, eq, isNull } from 'drizzle-orm';
import type { Request } from 'express';
import { createId, type AuthUser } from '../../common';
import { parseTtlToMs, parseTtlToSeconds } from '../../common/utils/parse-ttl';
import type { Env } from '../../config/env.validation';
import { DRIZZLE } from '../../database/database.constants';
import type { DrizzleDB } from '../../database/database.types';
import { login_logs, user_sessions, users } from '../../database/schema';
import { nowMysqlDateTime } from '../settings/utils/mysql-datetime';
import type { AccessTokenPayload } from './auth.types';
import {
  AuthMeResponseDto,
  AuthTokensResponseDto,
} from './dto/auth-response.dto';
import { PasswordService } from './password.service';
import { PermissionsLoader } from './permissions.loader';
import { generateRefreshToken, hashToken } from './token.utils';

type UserRow = {
  id: string;
  organization_id: string;
  branch_id: string | null;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_active: number;
  last_login_at: string | null;
  deleted_at: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly passwords: PasswordService,
    private readonly permissionsLoader: PermissionsLoader,
  ) {}

  async login(
    email: string,
    password: string,
    request: Request,
  ): Promise<AuthTokensResponseDto> {
    const normalizedEmail = email.trim().toLowerCase();
    const meta = this.requestMeta(request);

    const user = await this.findActiveUserByEmail(normalizedEmail);
    if (!user) {
      await this.writeLoginLog({
        emailAttempted: normalizedEmail,
        success: false,
        failureReason: 'unknown_email',
        ...meta,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.passwords.verify(user.password_hash, password);
    if (!valid) {
      await this.writeLoginLog({
        userId: user.id,
        emailAttempted: normalizedEmail,
        success: false,
        failureReason: 'invalid_password',
        ...meta,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user, meta);

    await this.db
      .update(users)
      .set({
        last_login_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(users.id, user.id));

    await this.writeLoginLog({
      userId: user.id,
      emailAttempted: normalizedEmail,
      success: true,
      ...meta,
    });

    return tokens;
  }

  async refresh(
    refreshToken: string,
    request: Request,
  ): Promise<AuthTokensResponseDto> {
    const tokenHash = hashToken(refreshToken);
    const meta = this.requestMeta(request);

    const [session] = await this.db
      .select()
      .from(user_sessions)
      .where(eq(user_sessions.token_hash, tokenHash))
      .limit(1);

    if (!session || session.revoked_at) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date(session.expires_at) <= new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.findActiveUserById(session.user_id);
    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    await this.db
      .update(user_sessions)
      .set({ revoked_at: nowMysqlDateTime() })
      .where(eq(user_sessions.id, session.id));

    return this.issueTokens(user, meta);
  }

  async logout(user: AuthUser): Promise<void> {
    if (!user.sessionId) {
      return;
    }

    await this.db
      .update(user_sessions)
      .set({ revoked_at: nowMysqlDateTime() })
      .where(eq(user_sessions.id, user.sessionId));
  }

  async me(user: AuthUser): Promise<AuthMeResponseDto> {
    const row = await this.findActiveUserById(user.id);
    if (!row) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const permissions =
      user.permissions ?? (await this.permissionsLoader.loadForUser(row.id));

    return {
      id: row.id,
      organizationId: row.organization_id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      branchId: row.branch_id,
      isActive: row.is_active === 1,
      lastLoginAt: row.last_login_at,
      permissions,
      isSuperAdmin: user.isSuperAdmin === true,
    };
  }

  async buildAuthUserFromAccessToken(
    payload: AccessTokenPayload,
  ): Promise<AuthUser> {
    const user = await this.findActiveUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    if (payload.sessionId) {
      const [session] = await this.db
        .select({
          id: user_sessions.id,
          revoked_at: user_sessions.revoked_at,
          expires_at: user_sessions.expires_at,
        })
        .from(user_sessions)
        .where(eq(user_sessions.id, payload.sessionId))
        .limit(1);

      if (
        !session ||
        session.revoked_at ||
        new Date(session.expires_at) <= new Date()
      ) {
        throw new UnauthorizedException('Session is no longer valid');
      }
    }

    const permissions = await this.permissionsLoader.loadForUser(user.id);

    return {
      id: user.id,
      organizationId: user.organization_id,
      email: user.email,
      permissions,
      isSuperAdmin: payload.isSuperAdmin === true,
      sessionId: payload.sessionId,
    };
  }

  private async issueTokens(
    user: UserRow,
    meta: { ipAddress: string | null; userAgent: string | null },
  ): Promise<AuthTokensResponseDto> {
    const accessTtl = this.config.get('JWT_ACCESS_TTL', { infer: true });
    const refreshTtl = this.config.get('JWT_REFRESH_TTL', { infer: true });
    const expiresIn = parseTtlToSeconds(accessTtl);
    const refreshMs = parseTtlToMs(refreshTtl);

    const sessionId = createId();
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + refreshMs)
      .toISOString()
      .replace('T', ' ')
      .replace('Z', '');

    await this.db.insert(user_sessions).values({
      id: sessionId,
      user_id: user.id,
      token_hash: hashToken(refreshToken),
      ip_address: meta.ipAddress,
      user_agent: meta.userAgent,
      expires_at: expiresAt,
    });

    const isSuperAdmin = this.isSuperAdminEmail(user.email);
    const payload: AccessTokenPayload = {
      sub: user.id,
      organizationId: user.organization_id,
      email: user.email,
      sessionId,
      isSuperAdmin,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      expiresIn,
    });

    return { accessToken, refreshToken, expiresIn };
  }

  private isSuperAdminEmail(email: string): boolean {
    const raw = process.env.SUPER_ADMIN_EMAILS ?? '';
    if (!raw.trim()) {
      return false;
    }
    const allowed = raw
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    return allowed.includes(email.toLowerCase());
  }

  private async findActiveUserByEmail(email: string): Promise<UserRow | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, email),
          eq(users.is_active, 1),
          isNull(users.deleted_at),
        ),
      )
      .limit(1);

    return (row as UserRow | undefined) ?? null;
  }

  private async findActiveUserById(id: string): Promise<UserRow | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, id),
          eq(users.is_active, 1),
          isNull(users.deleted_at),
        ),
      )
      .limit(1);

    return (row as UserRow | undefined) ?? null;
  }

  private async writeLoginLog(input: {
    userId?: string;
    emailAttempted: string;
    success: boolean;
    failureReason?: string;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<void> {
    await this.db.insert(login_logs).values({
      id: createId(),
      user_id: input.userId ?? null,
      email_attempted: input.emailAttempted,
      success: input.success ? 1 : 0,
      failure_reason: input.failureReason ?? null,
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
    });
  }

  private requestMeta(request: Request): {
    ipAddress: string | null;
    userAgent: string | null;
  } {
    const forwarded = request.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0]?.trim();

    return {
      ipAddress: forwardedIp || request.ip || null,
      userAgent: request.headers['user-agent'] ?? null,
    };
  }
}
