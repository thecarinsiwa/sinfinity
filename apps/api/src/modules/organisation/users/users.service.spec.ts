import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from '../../auth/password.service';
import { UsersService } from './users.service';

type Thenable<T> = PromiseLike<T> & Record<string, unknown>;

function thenable<T>(value: T): Thenable<T> {
  const chain: Thenable<T> = {
    then: (onFulfilled, onRejected) =>
      Promise.resolve(value).then(onFulfilled, onRejected),
  } as Thenable<T>;
  const self = () => chain;
  chain.from = jest.fn(self);
  chain.where = jest.fn(self);
  chain.orderBy = jest.fn(self);
  chain.limit = jest.fn(self);
  chain.offset = jest.fn(self);
  chain.$dynamic = jest.fn(self);
  chain.set = jest.fn(self);
  chain.values = jest.fn(self);
  return chain;
}

describe('UsersService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const row = {
    id: '0191e6b8-4c3a-7b2d-9f1e-useruseruser',
    organization_id: orgId,
    branch_id: null as string | null,
    email: 'jane.doe@sinfinity.cd',
    first_name: 'Jane',
    last_name: 'Doe',
    phone: null as string | null,
    avatar_url: null as string | null,
    is_active: 1,
    last_login_at: null as string | null,
    email_verified_at: null as string | null,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  const orgUser = {
    id: 'admin-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  let service: UsersService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
  };
  let passwords: { hash: jest.Mock };
  let jwt: { signAsync: jest.Mock };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn().mockReturnValue(thenable(undefined)),
    };
    passwords = {
      hash: jest.fn().mockResolvedValue('argon2-hash'),
    };
    jwt = {
      signAsync: jest.fn().mockResolvedValue('reset.jwt'),
    };
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_PASSWORD_RESET_TTL') return '1h';
        if (key === 'JWT_ACCESS_SECRET') {
          return 'test-access-secret-please-change-32ch';
        }
        return undefined;
      }),
    };

    service = new UsersService(
      db as never,
      passwords as unknown as PasswordService,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  it('lists users scoped to organization without password_hash', async () => {
    db.select
      .mockReturnValueOnce(thenable([row]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll(
      { page: 1, pageSize: 20, order: 'asc' },
      orgId,
      orgUser,
    );

    expect(result.data[0].email).toBe(row.email);
    expect(result.data[0]).not.toHaveProperty('password_hash');
  });

  it('requires organizationId on create', async () => {
    await expect(
      service.create({
        email: 'a@b.co',
        firstName: 'A',
        lastName: 'B',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a user with password and never returns the hash', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([row]));
    db.insert.mockReturnValue(thenable(undefined));

    const created = await service.create(
      {
        email: 'Jane.Doe@Sinfinity.cd',
        firstName: 'Jane',
        lastName: 'Doe',
        password: 'ChangeMe123!',
      },
      orgId,
      orgUser,
    );

    expect(passwords.hash).toHaveBeenCalledWith('ChangeMe123!');
    expect(created.email).toBe(row.email);
    expect(created).not.toHaveProperty('password_hash');
    expect(created.setPasswordToken).toBeUndefined();
  });

  it('returns a set-password token when create has no password', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([row]));
    db.insert.mockReturnValue(thenable(undefined));

    const created = await service.create(
      {
        email: 'jane.doe@sinfinity.cd',
        firstName: 'Jane',
        lastName: 'Doe',
      },
      orgId,
      orgUser,
    );

    expect(created.setPasswordToken).toBe('reset.jwt');
    expect(created.setPasswordExpiresIn).toBe(3600);
    expect(jwt.signAsync).toHaveBeenCalled();
  });

  it('maps duplicate email to ConflictException', async () => {
    db.select.mockReturnValueOnce(thenable([{ id: orgId }]));
    db.insert.mockReturnValue({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create(
        {
          email: 'jane.doe@sinfinity.cd',
          firstName: 'Jane',
          lastName: 'Doe',
          password: 'ChangeMe123!',
        },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('forbids access to another organization user', async () => {
    db.select.mockReturnValue(thenable([row]));

    await expect(
      service.findOne(row.id, 'other-org', {
        id: 'u2',
        organizationId: 'other-org',
        isSuperAdmin: false,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('issues admin reset-password token and revokes sessions', async () => {
    db.select.mockReturnValue(thenable([row]));

    const result = await service.resetPassword(row.id, orgId, orgUser);

    expect(result.setPasswordToken).toBe('reset.jwt');
    expect(result.expiresIn).toBe(3600);
    expect(db.update).toHaveBeenCalled();
  });

  it('cannot delete own account', async () => {
    db.select.mockReturnValue(thenable([row]));

    await expect(
      service.remove(row.id, orgId, {
        id: row.id,
        organizationId: orgId,
        isSuperAdmin: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 404 for missing user', async () => {
    db.select.mockReturnValue(thenable([]));

    await expect(
      service.findOne(row.id, orgId, orgUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
