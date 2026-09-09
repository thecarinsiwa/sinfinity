import { ConflictException } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';
import { SERVICE_REQUEST_STATUS } from '../service-request-statuses';

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

describe('ServiceRequestsService.convert', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const customerId = '0191e6b8-4c3a-7b2d-9f1e-custcustcustc';
  const requestId = '0191e6b8-4c3a-7b2d-9f1e-reqreqreqreqr';
  const ticketId = '0191e6b8-4c3a-7b2d-9f1e-tkttkttkttktt';

  let service: ServiceRequestsService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    transaction: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
      delete: jest.fn().mockReturnValue(thenable(undefined)),
      transaction: jest.fn((fn: (tx: typeof db) => unknown) =>
        Promise.resolve(fn(db)),
      ),
    };
    service = new ServiceRequestsService(db as never);
  });

  it('converts a new request into a ticket and sets convertedTicketId', async () => {
    const request = {
      id: requestId,
      organization_id: orgId,
      customer_id: customerId,
      request_type: 'repair',
      description: 'Broken ONU',
      status: SERVICE_REQUEST_STATUS.NEW,
      converted_ticket_id: null,
      requested_at: '2026-01-01 00:00:00.000',
      created_at: '2026-01-01 00:00:00.000',
      updated_at: '2026-01-01 00:00:00.000',
    };
    const completed = {
      ...request,
      status: SERVICE_REQUEST_STATUS.COMPLETED,
      converted_ticket_id: ticketId,
    };
    const ticket = {
      id: ticketId,
      organization_id: orgId,
      ticket_number: 'TKT-1',
      customer_id: customerId,
      contact_id: null,
      subject: 'repair',
      description: 'Broken ONU',
      priority: 'medium',
      status: 'open',
      assigned_to: null,
      related_serial_number_id: null,
      opened_at: '2026-01-01 00:00:00.000',
      closed_at: null,
      created_at: '2026-01-01 00:00:00.000',
      updated_at: '2026-01-01 00:00:00.000',
      deleted_at: null,
    };

    db.select
      .mockReturnValueOnce(thenable([request]))
      .mockReturnValueOnce(thenable([completed]))
      .mockReturnValueOnce(thenable([ticket]));

    const result = await service.convert(
      requestId,
      { ticketNumber: 'TKT-1' },
      orgId,
    );

    expect(result.serviceRequest.convertedTicketId).toBe(ticketId);
    expect(result.serviceRequest.status).toBe('completed');
    expect(result.ticket.ticketNumber).toBe('TKT-1');
    expect(db.transaction).toHaveBeenCalled();
  });

  it('rejects convert when already converted', async () => {
    db.select.mockReturnValueOnce(
      thenable([
        {
          id: requestId,
          organization_id: orgId,
          customer_id: customerId,
          request_type: 'repair',
          description: null,
          status: SERVICE_REQUEST_STATUS.COMPLETED,
          converted_ticket_id: ticketId,
          requested_at: '2026-01-01 00:00:00.000',
          created_at: '2026-01-01 00:00:00.000',
          updated_at: '2026-01-01 00:00:00.000',
        },
      ]),
    );

    await expect(
      service.convert(requestId, { ticketNumber: 'TKT-2' }, orgId),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
