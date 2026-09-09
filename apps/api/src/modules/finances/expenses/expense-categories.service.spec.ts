import { BadRequestException, ConflictException } from '@nestjs/common';
import { ExpenseCategoriesService } from './expense-categories.service';

type Thenable<T> = PromiseLike<T> & Record<string, unknown>;

function thenable<T>(value: T): Thenable<T> {
  const chain: Thenable<T> = {
    then: (onFulfilled, onRejected) =>
      Promise.resolve(value).then(onFulfilled, onRejected),
  };
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

describe('ExpenseCategoriesService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const catId = '0191e6b8-4c3a-7b2d-9f1e-catcatcatcatca';
  const parentId = '0191e6b8-4c3a-7b2d-9f1e-parentparentpa';

  let service: ExpenseCategoriesService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
    };
    service = new ExpenseCategoriesService(db as never);
  });

  it('creates category with uppercase code', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([
          {
            id: catId,
            organization_id: orgId,
            code: 'TRANSPORT',
            name: 'Transport',
            parent_id: null,
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
            deleted_at: null,
          },
        ]),
      );

    const result = await service.create(
      {
        organizationId: orgId,
        code: 'transport',
        name: 'Transport',
      },
      orgId,
    );

    expect(result.code).toBe('TRANSPORT');
  });

  it('rejects duplicate code', async () => {
    db.select.mockReturnValueOnce(thenable([{ id: orgId }]));
    db.insert.mockReturnValueOnce({
      values: jest
        .fn()
        .mockRejectedValue(Object.assign(new Error('dup'), { errno: 1062 })),
    });

    await expect(
      service.create(
        { organizationId: orgId, code: 'TRANSPORT', name: 'T' },
        orgId,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects delete when active children exist', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([
          {
            id: parentId,
            organization_id: orgId,
            code: 'ROOT',
            name: 'Root',
            parent_id: null,
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
            deleted_at: null,
          },
        ]),
      )
      .mockReturnValueOnce(thenable([{ id: catId }]));

    await expect(service.remove(parentId, orgId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
