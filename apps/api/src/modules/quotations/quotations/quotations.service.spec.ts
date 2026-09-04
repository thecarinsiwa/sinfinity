import { BadRequestException, ConflictException } from '@nestjs/common';
import { QuotationsService } from './quotations.service';

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

function mockFindOneSelects(
  db: { select: jest.Mock },
  quoteRow: Record<string, unknown>,
  draftStatus: Record<string, unknown>,
): void {
  db.select
    .mockReturnValueOnce(thenable([quoteRow]))
    .mockReturnValueOnce(thenable([draftStatus]))
    .mockReturnValueOnce(thenable([]))
    .mockReturnValueOnce(thenable([]));
}

describe('QuotationsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const customerId = '0191e6b8-4c3a-7b2d-9f1e-custcustcust';
  const quoteId = '0191e6b8-4c3a-7b2d-9f1e-quotequotequot';
  const draftStatusId = '0191e6b8-4c3a-7b2d-9f1e-statusdraft01';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const quoteRow = {
    id: quoteId,
    organization_id: orgId,
    quote_number: 'Q-2026-001',
    customer_id: customerId,
    opportunity_id: null as string | null,
    status_id: draftStatusId,
    version: 1,
    issue_date: null as string | null,
    valid_until: null as string | null,
    currency_id: null as string | null,
    exchange_rate: null as string | null,
    subtotal: '180.0000',
    tax_amount: '28.8000',
    total_amount: '208.8000',
    owner_user_id: null as string | null,
    notes: null as string | null,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  const draftStatus = {
    id: draftStatusId,
    code: 'DRAFT',
    name: 'Draft',
    is_final: 0,
    sort_order: 10,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
  };

  let service: QuotationsService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let statusesSeed: { seed: jest.Mock };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
      delete: jest.fn().mockReturnValue(thenable(undefined)),
    };
    statusesSeed = {
      seed: jest.fn().mockResolvedValue({ inserted: 0, updated: 5 }),
    };
    service = new QuotationsService(db as never, statusesSeed as never);
  });

  it('creates a draft quotation with initial version snapshot', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: customerId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([{ id: draftStatusId }]))
      // recordVersion: current version
      .mockReturnValueOnce(thenable([{ version: 1 }]));
    mockFindOneSelects(db, quoteRow, draftStatus);
    mockFindOneSelects(db, quoteRow, draftStatus);

    const result = await service.create(
      { quoteNumber: 'Q-2026-001', customerId },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalledTimes(2);
    expect(result.quoteNumber).toBe('Q-2026-001');
    expect(result.status?.code).toBe('DRAFT');
  });

  it('maps duplicate quote number to ConflictException', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: customerId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([{ id: draftStatusId }]));
    db.insert.mockReturnValueOnce({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create({ quoteNumber: 'Q-2026-001', customerId }, orgId, orgUser),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects item mutations when not DRAFT', async () => {
    const sentQuote = {
      ...quoteRow,
      status_id: 'sent-status',
    };
    db.select
      .mockReturnValueOnce(thenable([sentQuote]))
      .mockReturnValueOnce(
        thenable([
          {
            ...draftStatus,
            id: 'sent-status',
            code: 'SENT',
            name: 'Sent',
          },
        ]),
      );

    await expect(
      service.addItem(
        quoteId,
        { description: 'Line', quantity: '1', unitPrice: '10' },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('revises a SENT quotation back to DRAFT and bumps version', async () => {
    const sentStatusId = '0191e6b8-4c3a-7b2d-9f1e-statussent0001';
    const sentQuote = { ...quoteRow, status_id: sentStatusId, version: 2 };
    const sentStatus = {
      ...draftStatus,
      id: sentStatusId,
      code: 'SENT',
      name: 'Sent',
    };
    const revisedQuote = {
      ...quoteRow,
      status_id: draftStatusId,
      version: 3,
    };

    db.select
      // requireQuotationAccess
      .mockReturnValueOnce(thenable([sentQuote]))
      // loadStatus (SENT)
      .mockReturnValueOnce(thenable([sentStatus]))
      // requireStatusIdByCode DRAFT
      .mockReturnValueOnce(thenable([{ id: draftStatusId }]))
      // recordVersion current version
      .mockReturnValueOnce(thenable([{ version: 2 }]));
    mockFindOneSelects(db, revisedQuote, draftStatus);
    mockFindOneSelects(db, revisedQuote, draftStatus);

    const result = await service.revise(
      quoteId,
      { changeReason: 'Client pricing change' },
      orgId,
      orgUser,
    );

    expect(db.update).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
    expect(result.status?.code).toBe('DRAFT');
    expect(result.version).toBe(3);
  });

  it('rejects revise from DRAFT', async () => {
    db.select
      .mockReturnValueOnce(thenable([quoteRow]))
      .mockReturnValueOnce(thenable([draftStatus]));

    await expect(
      service.revise(quoteId, {}, orgId, orgUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists version summaries', async () => {
    db.select
      .mockReturnValueOnce(thenable([quoteRow]))
      .mockReturnValueOnce(
        thenable([
          {
            id: 'ver-2',
            quotation_id: quoteId,
            version_number: 2,
            snapshot: { quoteNumber: 'Q-2026-001' },
            changed_by: 'user-1',
            change_reason: 'Item added',
            created_at: '2026-09-04 11:00:00.000',
          },
          {
            id: 'ver-1',
            quotation_id: quoteId,
            version_number: 1,
            snapshot: { quoteNumber: 'Q-2026-001' },
            changed_by: 'user-1',
            change_reason: 'Created',
            created_at: '2026-09-04 10:00:00.000',
          },
        ]),
      );

    const result = await service.listVersions(quoteId, orgId, orgUser);
    expect(result).toHaveLength(2);
    expect(result[0].versionNumber).toBe(2);
    expect(result[0]).not.toHaveProperty('snapshot');
  });
});
