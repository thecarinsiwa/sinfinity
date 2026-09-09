import { BadRequestException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';

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

describe('ExpensesService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const expenseId = '0191e6b8-4c3a-7b2d-9f1e-expexpexpexpe';
  const otherOrgId = '0191e6b8-4c3a-7b2d-9f1e-otherotheroth';
  const landedCostId = '0191e6b8-4c3a-7b2d-9f1e-lclclclclclclc';

  let service: ExpensesService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
  };

  const draftRow = {
    id: expenseId,
    organization_id: orgId,
    category_id: null,
    title: 'Freight',
    amount: '100.0000',
    currency_id: null,
    expense_date: '2026-04-10',
    supplier_id: null,
    landed_cost_id: null,
    paid_by: null,
    status: 'draft',
    created_at: '2026-04-10',
    updated_at: '2026-04-10',
    deleted_at: null,
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
    };
    service = new ExpensesService(db as never);
  });

  it('transitions draft → approved → paid', async () => {
    db.select
      .mockReturnValueOnce(thenable([draftRow]))
      .mockReturnValueOnce(
        thenable([{ ...draftRow, status: 'approved' }]),
      );

    const approved = await service.transition(
      expenseId,
      { toStatus: 'approved' },
      orgId,
    );
    expect(approved.status).toBe('approved');

    db.select
      .mockReturnValueOnce(
        thenable([{ ...draftRow, status: 'approved' }]),
      )
      .mockReturnValueOnce(thenable([{ ...draftRow, status: 'paid' }]));

    const paid = await service.transition(
      expenseId,
      { toStatus: 'paid' },
      orgId,
    );
    expect(paid.status).toBe('paid');
  });

  it('rejects draft → paid', async () => {
    db.select.mockReturnValueOnce(thenable([draftRow]));

    await expect(
      service.transition(expenseId, { toStatus: 'paid' }, orgId),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects update when not draft', async () => {
    db.select.mockReturnValueOnce(
      thenable([{ ...draftRow, status: 'approved' }]),
    );

    await expect(
      service.update(expenseId, { title: 'X' }, orgId),
    ).rejects.toThrow(/only be updated while status is draft/);
  });

  it('rejects landed cost from another org', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([
          {
            id: landedCostId,
            organization_id: otherOrgId,
          },
        ]),
      );

    await expect(
      service.create(
        {
          organizationId: orgId,
          title: 'Customs',
          amount: '50.0000',
          expenseDate: '2026-04-10',
          landedCostId,
        },
        orgId,
      ),
    ).rejects.toThrow(/Landed cost must belong to the same organization/);
  });
});
