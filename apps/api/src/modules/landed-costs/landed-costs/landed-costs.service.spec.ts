import { BadRequestException, ForbiddenException } from '@nestjs/common';
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
  const usdId = '0191e6b8-4c3a-7b2d-9f1e-usdusdusdusdu';
  const cdfId = '0191e6b8-4c3a-7b2d-9f1e-cdfcdfcdfcdfc';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
    permissions: [
      'landed_costs.read',
      'landed_costs.write',
      'landed_costs.post',
    ],
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

  it('rejects calculate without currencyId', async () => {
    db.select.mockReturnValueOnce(thenable([headerRow]));

    await expect(
      service.calculate(landedCostId, 'value', orgId, orgUser),
    ).rejects.toThrow('currencyId is required');
  });

  it('rejects calculate when posted', async () => {
    db.select.mockReturnValueOnce(
      thenable([
        { ...headerRow, status: 'posted', currency_id: usdId },
      ]),
    );

    await expect(
      service.calculate(landedCostId, 'value', orgId, orgUser),
    ).rejects.toThrow('Posted landed costs are immutable');
  });

  it('rejects calculate when CDF→USD exchange rate is missing', async () => {
    const header = { ...headerRow, currency_id: usdId };
    const itemA = {
      id: 'item-a',
      landed_cost_id: landedCostId,
      product_id: null,
      purchase_order_item_id: null,
      quantity: '1.0000',
      goods_cost: '100.0000',
      allocated_costs: '0.0000',
      unit_landed_cost: '0.0000',
      total_landed_cost: '0.0000',
      created_at: '2026-09-09 10:00:00.000',
      updated_at: '2026-09-09 10:00:00.000',
    };

    db.select
      .mockReturnValueOnce(thenable([header]))
      .mockReturnValueOnce(thenable([itemA]))
      .mockReturnValueOnce(thenable([])) // shipping
      .mockReturnValueOnce(
        thenable([
          {
            duties_amount: '27500.0000',
            vat_amount: '0.0000',
            other_fees: '0.0000',
            currency_id: cdfId,
          },
        ]),
      )
      .mockReturnValueOnce(thenable([])); // no FX rate

    await expect(
      service.calculate(landedCostId, 'value', orgId, orgUser),
    ).rejects.toThrow(/No exchange rate/);
  });

  it('rejects soft-delete when posted', async () => {
    db.select.mockReturnValueOnce(
      thenable([{ ...headerRow, status: 'posted', currency_id: usdId }]),
    );

    await expect(
      service.remove(landedCostId, orgId, orgUser),
    ).rejects.toThrow('Posted landed costs are immutable');
  });

  it('calculates USD goods + USD shipping + CDF customs (value allocation)', async () => {
    const header = { ...headerRow, currency_id: usdId };
    const itemA = {
      id: 'item-a',
      landed_cost_id: landedCostId,
      product_id: null,
      purchase_order_item_id: null,
      quantity: '2.0000',
      goods_cost: '600.0000',
      allocated_costs: '0.0000',
      unit_landed_cost: '0.0000',
      total_landed_cost: '0.0000',
      created_at: '2026-09-09 10:00:00.000',
      updated_at: '2026-09-09 10:00:00.000',
    };
    const itemB = {
      ...itemA,
      id: 'item-b',
      quantity: '1.0000',
      goods_cost: '400.0000',
    };
    const calculatedHeader = {
      ...header,
      status: 'calculated' as const,
      goods_cost: '1000.0000',
      total_additional_costs: '21.0000',
      total_landed_cost: '1021.0000',
    };
    const calculatedItems = [
      {
        ...itemA,
        allocated_costs: '12.6000',
        unit_landed_cost: '306.3000',
        total_landed_cost: '612.6000',
      },
      {
        ...itemB,
        allocated_costs: '8.4000',
        unit_landed_cost: '408.4000',
        total_landed_cost: '408.4000',
      },
    ];

    db.select
      .mockReturnValueOnce(thenable([header]))
      .mockReturnValueOnce(thenable([itemA, itemB]))
      .mockReturnValueOnce(
        thenable([{ amount: '10.0000', currency_id: usdId }]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            duties_amount: '20000.0000',
            vat_amount: '5000.0000',
            other_fees: '2500.0000',
            currency_id: cdfId,
          },
        ]),
      )
      .mockReturnValueOnce(thenable([{ rate: '0.0004' }]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([calculatedHeader]))
      .mockReturnValueOnce(thenable(calculatedItems));

    const result = await service.calculate(
      landedCostId,
      'value',
      orgId,
      orgUser,
    );

    expect(result.status).toBe('calculated');
    expect(result.goodsCost).toBe('1000.0000');
    expect(result.totalAdditionalCosts).toBe('21.0000');
    expect(result.totalLandedCost).toBe('1021.0000');
    expect(result.items?.[0].allocatedCosts).toBe('12.6000');
    expect(result.items?.[1].allocatedCosts).toBe('8.4000');
  });

  it('rejects post when not calculated', async () => {
    db.select.mockReturnValueOnce(thenable([headerRow]));

    await expect(service.post(landedCostId, orgId, orgUser)).rejects.toThrow(
      'Only a calculated landed cost can be posted',
    );
  });

  it('rejects post without landed_costs.post permission', async () => {
    db.select.mockReturnValueOnce(
      thenable([{ ...headerRow, status: 'calculated', currency_id: usdId }]),
    );

    await expect(
      service.post(landedCostId, orgId, {
        ...orgUser,
        permissions: ['landed_costs.write'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('posts a calculated landed cost', async () => {
    const calculated = {
      ...headerRow,
      currency_id: usdId,
      status: 'calculated' as const,
    };
    const posted = { ...calculated, status: 'posted' as const };

    db.select
      .mockReturnValueOnce(thenable([calculated]))
      .mockReturnValueOnce(thenable([posted]))
      .mockReturnValueOnce(thenable([]));

    const result = await service.post(landedCostId, orgId, orgUser);
    expect(result.status).toBe('posted');
    expect(db.update).toHaveBeenCalled();
  });
});
