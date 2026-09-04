import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';

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

describe('ContractsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const customerId = '0191e6b8-4c3a-7b2d-9f1e-custcustcust';
  const contractId = '0191e6b8-4c3a-7b2d-9f1e-ctrctrctrctr';
  const itemId = '0191e6b8-4c3a-7b2d-9f1e-itemitemitem';

  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const contractRow = {
    id: contractId,
    organization_id: orgId,
    contract_number: 'CTR-2026-001',
    customer_id: customerId,
    supplier_id: null as string | null,
    title: 'Framework',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    status: 'draft' as const,
    document_id: null as string | null,
    total_value: '50000.0000',
    currency_id: null as string | null,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  const itemRow = {
    id: itemId,
    contract_id: contractId,
    product_id: null as string | null,
    service_id: null as string | null,
    description: 'Line A',
    quantity: '1.0000',
    unit_price: '100.0000',
    notes: null as string | null,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
  };

  let service: ContractsService;
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
    service = new ContractsService(db as never);
  });

  it('rejects create without customer or supplier', async () => {
    await expect(
      service.create(
        {
          contractNumber: 'CTR-1',
          title: 'X',
        },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a contract with items', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([contractRow]))
      .mockReturnValueOnce(thenable([itemRow]));

    const result = await service.create(
      {
        contractNumber: 'CTR-2026-001',
        title: 'Framework',
        customerId,
        items: [{ description: 'Line A', quantity: '1.0000' }],
      },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalledTimes(2);
    expect(result.contractNumber).toBe('CTR-2026-001');
    expect(result.items).toHaveLength(1);
  });

  it('maps duplicate contract number to ConflictException', async () => {
    db.select.mockReturnValueOnce(thenable([{ id: orgId }]));
    db.insert.mockReturnValueOnce({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create(
        {
          contractNumber: 'CTR-2026-001',
          title: 'Framework',
          customerId,
        },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists contracts for org', async () => {
    db.select
      .mockReturnValueOnce(thenable([contractRow]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll(
      { page: 1, pageSize: 20 },
      orgId,
      orgUser,
    );

    expect(result.data).toHaveLength(1);
    expect(result.data[0].items).toBeUndefined();
  });

  it('soft-deletes a contract', async () => {
    db.select.mockReturnValueOnce(thenable([contractRow]));

    await service.remove(contractId, orgId, orgUser);
    expect(db.update).toHaveBeenCalled();
  });

  it('throws when contract is missing', async () => {
    db.select.mockReturnValueOnce(thenable([]));

    await expect(
      service.findOne(contractId, orgId, orgUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('adds and removes an item', async () => {
    db.select
      .mockReturnValueOnce(thenable([contractRow]))
      .mockReturnValueOnce(thenable([itemRow]));

    const added = await service.addItem(
      contractId,
      { description: 'Line A' },
      orgId,
      orgUser,
    );
    expect(added.description).toBe('Line A');

    db.select
      .mockReturnValueOnce(thenable([contractRow]))
      .mockReturnValueOnce(thenable([itemRow]));

    await service.removeItem(contractId, itemId, orgId, orgUser);
    expect(db.delete).toHaveBeenCalled();
  });
});
