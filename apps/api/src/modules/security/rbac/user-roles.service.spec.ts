import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserRolesService } from './user-roles.service';

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
  chain.innerJoin = jest.fn(self);
  chain.set = jest.fn(self);
  chain.values = jest.fn(self);
  return chain;
}

describe('UserRolesService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const userId = '0191e6b8-4c3a-7b2d-9f1e-useruseruser';
  const roleId = '0191e6b8-4c3a-7b2d-9f1e-rolerolerole';

  const actor = {
    id: 'admin-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  let service: UserRolesService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn(),
      delete: jest.fn().mockReturnValue(thenable(undefined)),
    };
    service = new UserRolesService(db as never);
  });

  it('assigns a system role to a user in the same org', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([{ id: userId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: roleId,
            code: 'SALES',
            name: 'Sales',
            organization_id: null,
            is_system: 1,
          },
        ]),
      );
    db.insert.mockReturnValue(thenable(undefined));

    const created = await service.create(
      { userId, roleId },
      orgId,
      actor,
    );

    expect(created.userId).toBe(userId);
    expect(created.roleCode).toBe('SALES');
  });

  it('forbids assigning a role from another organization', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([{ id: userId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: roleId,
            code: 'CUSTOM',
            name: 'Custom',
            organization_id: 'other-org',
            is_system: 0,
          },
        ]),
      );

    await expect(
      service.create({ userId, roleId }, orgId, actor),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns 404 when removing unknown assignment', async () => {
    db.select.mockReturnValue(thenable([]));

    await expect(
      service.remove(roleId, orgId, actor),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
