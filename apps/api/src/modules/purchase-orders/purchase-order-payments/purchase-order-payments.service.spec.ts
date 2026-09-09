import { NotFoundException } from '@nestjs/common';
import { PurchaseOrderPaymentsService } from './purchase-order-payments.service';

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
  chain.set = jest.fn(self);
  chain.values = jest.fn(self);
  return chain;
}

describe('PurchaseOrderPaymentsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const orderId = '0191e6b8-4c3a-7b2d-9f1e-popopopopopo';
  const paymentId = '0191e6b8-4c3a-7b2d-9f1e-paypaypaypay';
  const methodId = '0191e6b8-4c3a-7b2d-9f1e-methodmethod';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const paymentRow = {
    id: paymentId,
    purchase_order_id: orderId,
    amount: '500.0000',
    currency_id: null as string | null,
    payment_method_id: methodId,
    paid_at: '2026-09-04 10:00:00.000',
    reference: 'TT-001',
    notes: 'Deposit' as string | null,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
  };

  let service: PurchaseOrderPaymentsService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
      delete: jest.fn().mockReturnValue(thenable(undefined)),
    };
    service = new PurchaseOrderPaymentsService(db as never);
  });

  it('creates a payment with paymentMethodId and no AP side-effect', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([{ id: orderId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(
        thenable([{ id: orderId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([paymentRow]));

    const result = await service.create(
      orderId,
      {
        amount: '500',
        paymentMethodId: methodId,
        paidAt: '2026-09-04T10:00:00.000Z',
        reference: 'TT-001',
        notes: 'Deposit',
      },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalled();
    expect(result.amount).toBe('500.0000');
    expect(result.paymentMethodId).toBe(methodId);
    expect(result.notes).toBe('Deposit');
  });

  it('rejects when purchase order is missing', async () => {
    db.select.mockReturnValueOnce(thenable([]));

    await expect(
      service.create(orderId, { amount: '10' }, orgId, orgUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('hard-deletes a payment row', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([{ id: orderId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([paymentRow]));

    await service.remove(orderId, paymentId, orgId, orgUser);
    expect(db.delete).toHaveBeenCalled();
  });
});
