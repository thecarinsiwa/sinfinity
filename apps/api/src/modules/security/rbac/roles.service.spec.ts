import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RolesService } from './roles.service';

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
  chain.innerJoin = jest.fn(self);
  chain.delete = jest.fn(self);
  return chain;
}

describe('RolesService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const orgRole = {
    id: '0191e6b8-4c3a-7b2d-9f1e-rolerolerole',
    organization_id: orgId,
    code: 'BRANCH_MANAGER',
    name: 'Branch manager',
    description: null as string | null,
    is_system: 0,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };
  const systemRole = {
    ...orgRole,
    id: '0191e6b8-4c3a-7b2d-9f1e-adminsystem1',
    organization_id: null,
    code: 'ADMIN',
    name: 'Administrator',
    is_system: 1,
  };

  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  let service: RolesService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn().mockReturnValue(thenable(undefined)),
      delete: jest.fn().mockReturnValue(thenable(undefined)),
    };
    service = new RolesService(db as never);
  });

  it('lists roles for an organization', async () => {
    db.select
      .mockReturnValueOnce(thenable([orgRole]))
      .mockReturnValueOnce(thenable([{ total: 1 }]))
      .mockReturnValueOnce(thenable([]));

    const result = await service.findAll(
      { page: 1, pageSize: 20, order: 'asc' },
      orgId,
      orgUser,
    );

    expect(result.data[0].code).toBe('BRANCH_MANAGER');
    expect(result.data[0].isSystem).toBe(false);
  });

  it('creates an org role', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([orgRole]))
      .mockReturnValueOnce(thenable([]));
    db.insert.mockReturnValue(thenable(undefined));

    const created = await service.create(
      { code: 'branch_manager', name: 'Branch manager' },
      orgId,
      orgUser,
    );

    expect(created.code).toBe('BRANCH_MANAGER');
  });

  it('forbids deleting system roles', async () => {
    db.select.mockReturnValue(thenable([systemRole]));

    await expect(
      service.remove(systemRole.id, orgId, orgUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires permissionIds or permissionCodes when setting permissions', async () => {
    db.select.mockReturnValue(thenable([orgRole]));

    await expect(
      service.setPermissions(orgRole.id, {}, orgId, orgUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 404 for missing role', async () => {
    db.select.mockReturnValue(thenable([]));

    await expect(
      service.findOne(orgRole.id, orgId, orgUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
