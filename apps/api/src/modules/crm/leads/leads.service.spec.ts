import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { LeadsService } from './leads.service';

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

describe('LeadsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const leadId = '0191e6b8-4c3a-7b2d-9f1e-leadleadlead';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const leadRow = {
    id: leadId,
    organization_id: orgId,
    source_id: null as string | null,
    company_name: 'Acme SA',
    contact_name: 'Jane Doe',
    email: 'jane@acme.test',
    phone: null as string | null,
    status: 'qualified' as const,
    owner_user_id: null as string | null,
    estimated_value: '10000.0000',
    currency_id: null as string | null,
    converted_customer_id: null as string | null,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  let service: LeadsService;
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
    service = new LeadsService(db as never);
  });

  it('creates a lead', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([{ ...leadRow, status: 'new' }]));

    const result = await service.create(
      { companyName: 'Acme SA', contactName: 'Jane Doe' },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalled();
    expect(result.companyName).toBe('Acme SA');
  });

  it('rejects invalid status transition', async () => {
    db.select.mockReturnValueOnce(thenable([{ ...leadRow, status: 'lost' }]));

    await expect(
      service.update(leadId, { status: 'qualified' }, orgId, orgUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('converts a qualified lead into a customer', async () => {
    const convertedLead = {
      ...leadRow,
      status: 'converted' as const,
      converted_customer_id: '0191e6b8-4c3a-7b2d-9f1e-custcustcust',
    };
    const customerRow = {
      id: convertedLead.converted_customer_id,
      organization_id: orgId,
      category_id: null,
      code: 'CUST-LEAD-001',
      type: 'organization' as const,
      name: 'Acme SA',
      legal_name: null,
      tax_id: null,
      email: 'jane@acme.test',
      phone: null,
      website: null,
      owner_user_id: null,
      status: 'active' as const,
      converted_from_lead_id: leadId,
      created_at: '2026-09-04 10:00:00.000',
      updated_at: '2026-09-04 10:00:00.000',
      deleted_at: null,
    };

    db.select
      .mockReturnValueOnce(thenable([leadRow]))
      .mockReturnValueOnce(thenable([customerRow]))
      .mockReturnValueOnce(thenable([convertedLead]));

    const result = await service.convert(
      leadId,
      { customerCode: 'CUST-LEAD-001' },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalled();
    expect(result.lead.status).toBe('converted');
    expect(result.customer.code).toBe('CUST-LEAD-001');
    expect(result.customer.convertedFromLeadId).toBe(leadId);
  });

  it('rejects convert when already converted', async () => {
    db.select.mockReturnValueOnce(
      thenable([{ ...leadRow, status: 'converted' }]),
    );

    await expect(
      service.convert(leadId, {}, orgId, orgUser),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when lead is missing', async () => {
    db.select.mockReturnValueOnce(thenable([]));

    await expect(
      service.findOne(leadId, orgId, orgUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
