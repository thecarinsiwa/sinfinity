import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SalesActivitiesService } from './sales-activities.service';

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

describe('SalesActivitiesService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const activityId = '0191e6b8-4c3a-7b2d-9f1e-actactactact';
  const customerId = '0191e6b8-4c3a-7b2d-9f1e-custcustcust';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const row = {
    id: activityId,
    organization_id: orgId,
    activity_type_id: null as string | null,
    subject: 'Follow-up call',
    description: null as string | null,
    related_type: 'customer',
    related_id: customerId,
    user_id: 'user-1',
    scheduled_at: '2026-09-10 14:00:00.000',
    completed_at: null as string | null,
    outcome: null as string | null,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  let service: SalesActivitiesService;
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
    service = new SalesActivitiesService(db as never);
  });

  it('creates an activity linked to a customer and defaults userId', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([{ id: customerId }]))
      .mockReturnValueOnce(thenable([row]));

    const result = await service.create(
      {
        subject: 'Follow-up call',
        relatedType: 'customer',
        relatedId: customerId,
      },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalled();
    expect(result.subject).toBe('Follow-up call');
    expect(result.userId).toBe('user-1');
  });

  it('rejects relatedType without relatedId', async () => {
    db.select.mockReturnValueOnce(thenable([{ id: orgId }]));

    await expect(
      service.create(
        { subject: 'Call', relatedType: 'lead' },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unknown related customer', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([]));

    await expect(
      service.create(
        {
          subject: 'Call',
          relatedType: 'customer',
          relatedId: customerId,
        },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when activity is missing', async () => {
    db.select.mockReturnValueOnce(thenable([]));

    await expect(
      service.findOne(activityId, orgId, orgUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
