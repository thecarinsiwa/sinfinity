import { BadRequestException, ConflictException } from '@nestjs/common';
import { WarrantiesService } from './warranties.service';
import { CLAIM_STATUS } from '../claim-statuses';
import { WARRANTY_STATUS } from '../warranty-statuses';

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

describe('WarrantiesService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const otherOrgId = '0191e6b8-4c3a-7b2d-9f1e-otherorgother';
  const warrantyId = '0191e6b8-4c3a-7b2d-9f1e-warwarwarwarw';
  const claimId = '0191e6b8-4c3a-7b2d-9f1e-clmclmclmclmc';
  const productId = '0191e6b8-4c3a-7b2d-9f1e-prodprodprodp';
  const customerId = '0191e6b8-4c3a-7b2d-9f1e-custcustcustc';
  const serialId = '0191e6b8-4c3a-7b2d-9f1e-sersersersers';

  const warranty = {
    id: warrantyId,
    organization_id: orgId,
    product_id: productId,
    serial_number_id: null as string | null,
    customer_id: customerId,
    sales_order_id: null,
    start_date: '2026-01-01',
    end_date: '2027-01-01',
    warranty_type: 'seller' as const,
    terms: null,
    status: WARRANTY_STATUS.ACTIVE,
    created_at: '2026-01-01 00:00:00.000',
    updated_at: '2026-01-01 00:00:00.000',
  };

  let service: WarrantiesService;
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
    service = new WarrantiesService(db as never);
  });

  it('rejects create when serial belongs to another organization', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: customerId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(
        thenable([{ id: productId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: serialId,
            organization_id: otherOrgId,
            product_id: productId,
          },
        ]),
      );

    await expect(
      service.create(
        {
          organizationId: orgId,
          productId,
          customerId,
          serialNumberId: serialId,
          startDate: '2026-01-01',
        },
        orgId,
      ),
    ).rejects.toThrow(/Serial number must belong to the same organization/);
  });

  it('transitions claim submitted → approved', async () => {
    const claim = {
      id: claimId,
      warranty_id: warrantyId,
      ticket_id: null,
      claim_number: 'CLM-1',
      description: 'Dead on arrival',
      status: CLAIM_STATUS.SUBMITTED,
      resolution: null as string | null,
      claimed_at: '2026-01-02 00:00:00.000',
      created_at: '2026-01-02 00:00:00.000',
      updated_at: '2026-01-02 00:00:00.000',
    };
    const approved = {
      ...claim,
      status: CLAIM_STATUS.APPROVED,
      resolution: 'RMA issued',
    };

    db.select
      .mockReturnValueOnce(thenable([warranty]))
      .mockReturnValueOnce(thenable([claim]))
      .mockReturnValueOnce(thenable([approved]));

    const result = await service.transitionClaim(
      warrantyId,
      claimId,
      { toStatus: 'approved', resolution: 'RMA issued' },
      orgId,
    );

    expect(result.status).toBe('approved');
    expect(result.resolution).toBe('RMA issued');
    expect(db.update).toHaveBeenCalled();
  });

  it('rejects duplicate claim number on same warranty', async () => {
    db.select
      .mockReturnValueOnce(thenable([warranty]))
      .mockReturnValueOnce(thenable([{ id: claimId }]));

    await expect(
      service.createClaim(
        warrantyId,
        { claimNumber: 'CLM-1', description: 'dup' },
        orgId,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects claim transition from approved', async () => {
    db.select.mockReturnValueOnce(thenable([warranty])).mockReturnValueOnce(
      thenable([
        {
          id: claimId,
          warranty_id: warrantyId,
          ticket_id: null,
          claim_number: 'CLM-1',
          description: null,
          status: CLAIM_STATUS.APPROVED,
          resolution: null,
          claimed_at: '2026-01-02 00:00:00.000',
          created_at: '2026-01-02 00:00:00.000',
          updated_at: '2026-01-02 00:00:00.000',
        },
      ]),
    );

    await expect(
      service.transitionClaim(
        warrantyId,
        claimId,
        { toStatus: 'fulfilled' },
        orgId,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
