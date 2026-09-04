import { BadRequestException } from '@nestjs/common';
import { ProcurementComparisonsService } from './procurement-comparisons.service';

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

describe('ProcurementComparisonsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const requestId = '0191e6b8-4c3a-7b2d-9f1e-reqreqreqreq';
  const quoteId = '0191e6b8-4c3a-7b2d-9f1e-quotequotequot';
  const comparisonId = '0191e6b8-4c3a-7b2d-9f1e-compcompcomp';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  let service: ProcurementComparisonsService;
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
    service = new ProcurementComparisonsService(db as never);
  });

  it('creates comparison, selects quote, and bumps quoted → compared', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([
          { id: requestId, organization_id: orgId, status: 'quoted' },
        ]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: quoteId,
            status: 'shortlisted',
            procurement_request_id: requestId,
          },
        ]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: comparisonId,
            procurement_request_id: requestId,
            compared_by: 'user-1',
            compared_at: '2026-09-04 10:00:00.000',
            criteria: { price: 1 },
            scores: { [quoteId]: 90 },
            selected_quote_id: quoteId,
            recommendation: 'Go',
            created_at: '2026-09-04 10:00:00.000',
            updated_at: '2026-09-04 10:00:00.000',
          },
        ]),
      );

    const result = await service.create(
      requestId,
      {
        criteria: { price: 1 },
        scores: { [quoteId]: 90 },
        selectedQuoteId: quoteId,
        recommendation: 'Go',
      },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalled();
    expect(result.selectedQuoteId).toBe(quoteId);
    expect(result.recommendation).toBe('Go');
  });

  it('rejects comparison when request is open', async () => {
    db.select.mockReturnValueOnce(
      thenable([{ id: requestId, organization_id: orgId, status: 'open' }]),
    );

    await expect(
      service.create(requestId, {}, orgId, orgUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
