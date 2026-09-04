import { BadRequestException } from '@nestjs/common';
import { ProcurementApprovalsService } from './procurement-approvals.service';

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

describe('ProcurementApprovalsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const requestId = '0191e6b8-4c3a-7b2d-9f1e-reqreqreqreq';
  const approvalId = '0191e6b8-4c3a-7b2d-9f1e-apprapprappr';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  let service: ProcurementApprovalsService;
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
    service = new ProcurementApprovalsService(db as never);
  });

  it('approves and sets request to approved without creating a PO', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([
          { id: requestId, organization_id: orgId, status: 'compared' },
        ]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: approvalId,
            procurement_request_id: requestId,
            procurement_quote_id: null,
            approver_id: 'user-1',
            status: 'approved',
            decision_at: '2026-09-04 10:00:00.000',
            comments: 'OK',
            created_at: '2026-09-04 10:00:00.000',
            updated_at: '2026-09-04 10:00:00.000',
          },
        ]),
      );

    const result = await service.create(
      requestId,
      { status: 'approved', comments: 'OK' },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalled();
    expect(result.status).toBe('approved');
  });

  it('rejects approve when request is not compared', async () => {
    db.select.mockReturnValueOnce(
      thenable([{ id: requestId, organization_id: orgId, status: 'quoted' }]),
    );

    await expect(
      service.create(requestId, { status: 'approved' }, orgId, orgUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects decision keeps request compared (no request status update)', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([
          { id: requestId, organization_id: orgId, status: 'compared' },
        ]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: approvalId,
            procurement_request_id: requestId,
            procurement_quote_id: null,
            approver_id: 'user-1',
            status: 'rejected',
            decision_at: '2026-09-04 10:00:00.000',
            comments: 'No',
            created_at: '2026-09-04 10:00:00.000',
            updated_at: '2026-09-04 10:00:00.000',
          },
        ]),
      );

    const result = await service.create(
      requestId,
      { status: 'rejected', comments: 'No' },
      orgId,
      orgUser,
    );

    expect(result.status).toBe('rejected');
    expect(db.update).not.toHaveBeenCalled();
  });
});
