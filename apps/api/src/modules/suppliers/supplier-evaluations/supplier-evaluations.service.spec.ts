import { NotFoundException } from '@nestjs/common';
import { resolveOverallScore } from './supplier-evaluations.mapper';
import { SupplierEvaluationsService } from './supplier-evaluations.service';

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
  chain.innerJoin = jest.fn(self);
  chain.set = jest.fn(self);
  chain.values = jest.fn(self);
  return chain;
}

describe('resolveOverallScore', () => {
  it('averages provided scores when overall omitted', () => {
    expect(resolveOverallScore(4, 5, 3)).toBe('4.00');
  });

  it('prefers explicit overallScore', () => {
    expect(resolveOverallScore(4, 5, 3, '4.5')).toBe('4.50');
  });

  it('returns null when nothing provided', () => {
    expect(resolveOverallScore(null, null, null)).toBeNull();
  });
});

describe('SupplierEvaluationsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const supplierId = '0191e6b8-4c3a-7b2d-9f1e-supsupsupsup';
  const evalId = '0191e6b8-4c3a-7b2d-9f1e-evalevaleval';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const evalRow = {
    id: evalId,
    supplier_id: supplierId,
    evaluated_by: 'user-1',
    evaluated_at: '2026-09-04',
    quality_score: 4,
    delivery_score: 5,
    price_score: 3,
    overall_score: '4.00',
    comments: null as string | null,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
  };

  let service: SupplierEvaluationsService;
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
    service = new SupplierEvaluationsService(db as never);
  });

  it('creates an evaluation and optionally updates supplier rating', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([{ id: supplierId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(
        thenable([{ ...evalRow, organization_id: orgId }]),
      );

    const result = await service.create(
      {
        supplierId,
        qualityScore: 4,
        deliveryScore: 5,
        priceScore: 3,
      },
      true,
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalledTimes(2);
    expect(db.update).toHaveBeenCalled();
    expect(result.overallScore).toBe('4.00');
    expect(result.evaluatedBy).toBe('user-1');
  });

  it('throws when supplier is missing', async () => {
    db.select.mockReturnValueOnce(thenable([]));

    await expect(
      service.create({ supplierId }, false, orgId, orgUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('hard-deletes an evaluation', async () => {
    db.select.mockReturnValueOnce(
      thenable([{ ...evalRow, organization_id: orgId }]),
    );

    await service.remove(evalId, orgId, orgUser);
    expect(db.delete).toHaveBeenCalled();
  });
});
