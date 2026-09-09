import { BadRequestException } from '@nestjs/common';
import { LandedCostsService } from './landed-costs.service';

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

describe('LandedCostsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const poId = '0191e6b8-4c3a-7b2d-9f1e-popopopopopo';
  const landedCostId = '0191e6b8-4c3a-7b2d-9f1e-lclclclclclc';
  const itemId = '0191e6b8-4c3a-7b2d-9f1e-itemitemitemi';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
    permissions: ['landed_costs.read', 'landed_costs.write'],
  };

  const headerRow = {
    id: landedCostId,
    organization_id: orgId,
    reference: 'LC-2026-001',
    purchase_order_id: poId,
    shipment_id: null as string | null,
    currency_id: null as string | null,
    goods_cost: '0.0000',
    total_additional_costs: '0.0000',
    total_landed_cost: '0.0000',
    status: 'draft' as const,
    calculated_at: null as string | null,
    calculated_by: null as string | null,
    created_at: '2026-09-09 10:00:00.000',
    updated_at: '2026-09-09 10:00:00.000',
    deleted_at: null as string | null,
  };

  let service: LandedCostsService;
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
    service = new LandedCostsService(db as never);
  });

  it('creates a draft landed cost linked to a PO', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: poId, organization_id: orgId, deleted_at: null }]),
      )
      .mockReturnValueOnce(thenable([headerRow]))
      .mockReturnValueOnce(thenable([]));

    const result = await service.create(
      { reference: 'LC-2026-001', purchaseOrderId: poId },
      orgId,
      orgUser,
    );

    expect(result.status).toBe('draft');
    expect(result.reference).toBe('LC-2026-001');
    expect(result.purchaseOrderId).toBe(poId);
    expect(db.insert).toHaveBeenCalled();
  });

  it('rejects create without PO or shipment', async () => {
    db.select.mockReturnValueOnce(thenable([{ id: orgId }]));

    await expect(
      service.create({ reference: 'LC-2026-002' }, orgId, orgUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects mutations when posted', async () => {
    db.select.mockReturnValueOnce(
      thenable([{ ...headerRow, status: 'posted' }]),
    );

    await expect(
      service.update(landedCostId, { reference: 'LC-X' }, orgId, orgUser),
    ).rejects.toThrow('Posted landed costs are immutable');
  });

  it('adds an item and recalculates goodsCost', async () => {
    const itemRow = {
      id: itemId,
      landed_cost_id: landedCostId,
      product_id: null as string | null,
      purchase_order_item_id: null as string | null,
      quantity: '2.0000',
      goods_cost: '100.0000',
      allocated_costs: '0.0000',
      unit_landed_cost: '0.0000',
      total_landed_cost: '0.0000',
      created_at: '2026-09-09 10:00:00.000',
      updated_at: '2026-09-09 10:00:00.000',
    };

    db.select
      .mockReturnValueOnce(thenable([headerRow]))
      .mockReturnValueOnce(thenable([itemRow]))
      .mockReturnValueOnce(
        thenable([{ total_additional_costs: '0.0000' }]),
      )
      .mockReturnValueOnce(thenable([itemRow]));

    const result = await service.addItem(
      landedCostId,
      { quantity: '2', goodsCost: '100' },
      orgId,
      orgUser,
    );

    expect(result.goodsCost).toBe('100.0000');
    expect(db.insert).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalled();
  });

  it('rejects item mutation when posted', async () => {
    db.select.mockReturnValueOnce(
      thenable([{ ...headerRow, status: 'posted' }]),
    );

    await expect(
      service.addItem(
        landedCostId,
        { quantity: '1', goodsCost: '10' },
        orgId,
        orgUser,
      ),
    ).rejects.toThrow('Posted landed costs are immutable');
  });
});
