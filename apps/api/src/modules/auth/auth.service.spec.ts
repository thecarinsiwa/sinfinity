import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import {
  UNIT_TEST_PASSWORD,
  UNIT_TEST_PASSWORD_ALT,
} from '../../test-fixtures/passwords';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { PermissionsLoader } from './permissions.loader';

type Thenable<T> = PromiseLike<T> & Record<string, unknown>;

function thenable<T>(value: T): Thenable<T> {
  const chain: Thenable<T> = {
    then: (onFulfilled, onRejected) =>
      Promise.resolve(value).then(onFulfilled, onRejected),
  } as Thenable<T>;
  const self = () => chain;
  chain.from = jest.fn(self);
  chain.where = jest.fn(self);
  chain.limit = jest.fn(self);
  chain.set = jest.fn(self);
  chain.values = jest.fn(self);
  chain.innerJoin = jest.fn(self);
  return chain;
}

describe('AuthService', () => {
  const userRow = {
    id: 'user-1',
    organization_id: 'org-1',
    branch_id: null,
    email: 'admin@sinfinity.cd',
    password_hash: 'hashed',
    first_name: 'Ada',
    last_name: 'Lovelace',
    phone: null,
    is_active: 1,
    last_login_at: null,
    deleted_at: null,
  };

  let service: AuthService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
  };
  let passwords: { verify: jest.Mock; hash: jest.Mock };
  let jwt: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let permissionsLoader: { loadForUser: jest.Mock };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
    };
    passwords = {
      verify: jest.fn(),
      hash: jest.fn(),
    };
    jwt = {
      signAsync: jest.fn().mockResolvedValue('access.jwt'),
      verifyAsync: jest.fn(),
    };
    permissionsLoader = {
      loadForUser: jest.fn().mockResolvedValue(['settings.read']),
    };

    const config = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_ACCESS_TTL') return '15m';
        if (key === 'JWT_REFRESH_TTL') return '7d';
        if (key === 'JWT_ACCESS_SECRET') return 'test-access-secret-please-change-32ch';
        return undefined;
      }),
    };

    service = new AuthService(
      db as never,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
      passwords as unknown as PasswordService,
      permissionsLoader as unknown as PermissionsLoader,
    );
  });

  const req = {
    ip: '127.0.0.1',
    headers: { 'user-agent': 'jest' },
  } as unknown as Request;

  it('logs in and returns tokens', async () => {
    db.select.mockReturnValue(thenable([userRow]));
    passwords.verify.mockResolvedValue(true);

    const result = await service.login(
      'Admin@Sinfinity.cd',
      UNIT_TEST_PASSWORD,
      req,
    );

    expect(result.accessToken).toBe('access.jwt');
    expect(result.refreshToken).toBeDefined();
    expect(result.expiresIn).toBe(900);
    expect(db.insert).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalled();
  });

  it('rejects invalid password and writes failure log', async () => {
    db.select.mockReturnValue(thenable([userRow]));
    passwords.verify.mockResolvedValue(false);

    await expect(
      service.login('admin@sinfinity.cd', UNIT_TEST_PASSWORD_ALT, req),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(db.insert).toHaveBeenCalled();
  });

  it('returns me profile without password_hash', async () => {
    db.select.mockReturnValue(thenable([userRow]));

    const me = await service.me({
      id: userRow.id,
      organizationId: userRow.organization_id,
      email: userRow.email,
      permissions: ['settings.read'],
      isSuperAdmin: false,
      sessionId: 'session-1',
    });

    expect(me).toMatchObject({
      id: userRow.id,
      email: userRow.email,
      firstName: 'Ada',
      permissions: ['settings.read'],
    });
    expect(me).not.toHaveProperty('password_hash');
  });

  it('sets password from a valid reset token and revokes sessions', async () => {
    jwt.verifyAsync.mockResolvedValue({
      sub: userRow.id,
      organizationId: userRow.organization_id,
      email: userRow.email,
      purpose: 'password_reset',
    });
    db.select.mockReturnValue(thenable([{ id: userRow.id }]));
    passwords.hash.mockResolvedValue('new-hash');

    await service.setPassword('reset.jwt', UNIT_TEST_PASSWORD_ALT);

    expect(passwords.hash).toHaveBeenCalledWith(UNIT_TEST_PASSWORD_ALT);
    expect(db.update).toHaveBeenCalled();
  });

  it('rejects invalid set-password tokens', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));

    await expect(
      service.setPassword('bad.jwt', UNIT_TEST_PASSWORD_ALT),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
