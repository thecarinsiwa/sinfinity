import { BadRequestException } from '@nestjs/common';
import { AncillaryFeesService } from './ancillary-fees.service';
import type { LandedCostsService } from '../landed-costs/landed-costs.service';

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

describe('AncillaryFeesService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const landedCostId = '0191e6b8-4c3a-7b2d-9f1e-lclclclclclc';
  const feeId = '0191e6b8-4c3a-7b2d-9f1e-feefeefeefee';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
    permissions: ['landed_costs.read', 'landed_costs.write'],
  };

  const header = {
    id: landedCostId,
    organization_id: orgId,
    status: 'draft' as const,
  };

  let service: AncillaryFeesService;
  let landedCostsService: {
    requireAccess: jest.Mock;
    requireMutableAccess: jest.Mock;
    markDraftAfterFeeChange: jest.Mock;
  };
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
    landedCostsService = {
      requireAccess: jest.fn().mockResolvedValue(header),
      requireMutableAccess: jest.fn().mockResolvedValue(header),
      markDraftAfterFeeChange: jest.fn().mockResolvedValue(undefined),
    };
    service = new AncillaryFeesService(
      db as never,
      landedCostsService as unknown as LandedCostsService,
    );
  });

  it('creates a shipping cost in source currency and marks draft', async () => {
    const row = {
      id: feeId,
      landed_cost_id: landedCostId,
      shipment_id: null,
      shipping_method_id: null,
      carrier_id: null,
      amount: '10.0000',
      currency_id: 'usd-id',
      description: null,
      created_at: '2026-09-09 10:00:00.000',
      updated_at: '2026-09-09 10:00:00.000',
    };
    db.select
      .mockReturnValueOnce(thenable([row])); // get after create

    const result = await service.createShippingCost(
      landedCostId,
      { amount: '10', currencyId: 'usd-id' },
      orgId,
      orgUser,
    );

    expect(result.amount).toBe('10.0000');
    expect(result.currencyId).toBe('usd-id');
    expect(landedCostsService.markDraftAfterFeeChange).toHaveBeenCalledWith(
      landedCostId,
    );
    expect(db.insert).toHaveBeenCalled();
  });

  it('creates customs costs without converting CDF amounts', async () => {
    const row = {
      id: feeId,
      landed_cost_id: landedCostId,
      customs_declaration_id: null,
      duties_amount: '20000.0000',
      vat_amount: '5000.0000',
      other_fees: '2500.0000',
      currency_id: 'cdf-id',
      description: null,
      created_at: '2026-09-09 10:00:00.000',
      updated_at: '2026-09-09 10:00:00.000',
    };
    db.select.mockReturnValueOnce(thenable([row]));

    const result = await service.createCustomsCost(
      landedCostId,
      {
        dutiesAmount: '20000',
        vatAmount: '5000',
        otherFees: '2500',
        currencyId: 'cdf-id',
      },
      orgId,
      orgUser,
    );

    expect(result.dutiesAmount).toBe('20000.0000');
    expect(result.currencyId).toBe('cdf-id');
  });

  it('rejects fee writes when header is posted', async () => {
    landedCostsService.requireMutableAccess.mockRejectedValue(
      new BadRequestException('Posted landed costs are immutable'),
    );

    await expect(
      service.createHandlingCost(
        landedCostId,
        { amount: '50' },
        orgId,
        orgUser,
      ),
    ).rejects.toThrow('Posted landed costs are immutable');
  });

  it('creates other procurement cost with costType', async () => {
    const row = {
      id: feeId,
      landed_cost_id: landedCostId,
      cost_type: 'insurance',
      amount: '90.0000',
      currency_id: null,
      description: null,
      created_at: '2026-09-09 10:00:00.000',
      updated_at: '2026-09-09 10:00:00.000',
    };
    db.select.mockReturnValueOnce(thenable([row]));

    const result = await service.createOtherProcurementCost(
      landedCostId,
      { costType: 'insurance', amount: '90' },
      orgId,
      orgUser,
    );

    expect(result.costType).toBe('insurance');
  });
});
