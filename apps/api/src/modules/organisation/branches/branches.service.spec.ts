import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BranchesService } from './branches.service';

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

describe('BranchesService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const row = {
    id: '0191e6b8-4c3a-7b2d-9f1e-branchbranch',
    organization_id: orgId,
    code: 'HQ-KIN',
    name: 'Siège Kinshasa',
    type: 'office' as const,
    address: null as string | null,
    city_id: null as string | null,
    phone: null as string | null,
    manager_user_id: null as string | null,
    is_active: 1,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  let service: BranchesService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    };
    service = new BranchesService(db as never);
  });

  it('lists branches scoped to organization', async () => {
    db.select
      .mockReturnValueOnce(thenable([row]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll(
      { page: 1, pageSize: 20, order: 'asc' },
      orgId,
      orgUser,
    );

    expect(result.data[0].code).toBe('HQ-KIN');
    expect(result.data[0].type).toBe('office');
  });

  it('requires organizationId on create', async () => {
    await expect(
      service.create({ code: 'HQ', name: 'HQ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a branch for the current org', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([row]));
    db.insert.mockReturnValue(thenable(undefined));

    const created = await service.create(
      { code: 'hq-kin', name: 'Siège Kinshasa', type: 'office' },
      orgId,
      orgUser,
    );

    expect(created.organizationId).toBe(orgId);
    expect(created.code).toBe('HQ-KIN');
  });

  it('maps duplicate code to ConflictException', async () => {
    db.select.mockReturnValueOnce(thenable([{ id: orgId }]));
    db.insert.mockReturnValue({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create({ code: 'HQ-KIN', name: 'X' }, orgId, orgUser),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('forbids access to another organization branch', async () => {
    db.select.mockReturnValue(thenable([row]));

    await expect(
      service.findOne(row.id, 'other-org', {
        id: 'u2',
        organizationId: 'other-org',
        isSuperAdmin: false,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('soft-deletes a branch', async () => {
    db.select.mockReturnValue(thenable([row]));
    db.update.mockReturnValue(thenable(undefined));

    await service.remove(row.id, orgId, orgUser);
    expect(db.update).toHaveBeenCalled();
  });

  it('throws when branch missing', async () => {
    db.select.mockReturnValue(thenable([]));
    await expect(service.findOne(row.id, orgId, orgUser)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
