import { BadRequestException, ConflictException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';

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

describe('AppointmentsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const userId = '0191e6b8-4c3a-7b2d-9f1e-useruseruseru';
  const apptId = '0191e6b8-4c3a-7b2d-9f1e-apptapptapptap';

  let service: AppointmentsService;
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
    service = new AppointmentsService(db as never);
  });

  it('rejects startAt >= endAt', async () => {
    db.select.mockReturnValueOnce(thenable([{ id: orgId }]));

    await expect(
      service.create(
        {
          organizationId: orgId,
          title: 'Bad range',
          startAt: '2026-04-15T11:00:00.000Z',
          endAt: '2026-04-15T10:00:00.000Z',
        },
        orgId,
        { id: userId, organizationId: orgId } as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects overlapping appointment for same organizer', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: userId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(
        thenable([{ id: 'other', title: 'Existing visit' }]),
      );

    await expect(
      service.create(
        {
          organizationId: orgId,
          title: 'Conflict',
          startAt: '2026-04-15T09:30:00.000Z',
          endAt: '2026-04-15T10:30:00.000Z',
          organizerId: userId,
        },
        orgId,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates when no overlap', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: userId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(
        thenable([
          {
            id: apptId,
            organization_id: orgId,
            title: 'Ok',
            description: null,
            start_at: '2026-04-15 09:00:00.000',
            end_at: '2026-04-15 10:00:00.000',
            location: null,
            meeting_type: 'in_person',
            organizer_id: userId,
            customer_id: null,
            status: 'scheduled',
            created_at: '2026-04-01',
            updated_at: '2026-04-01',
            deleted_at: null,
          },
        ]),
      );

    const result = await service.create(
      {
        organizationId: orgId,
        title: 'Ok',
        startAt: '2026-04-15T09:00:00.000Z',
        endAt: '2026-04-15T10:00:00.000Z',
        organizerId: userId,
      },
      orgId,
    );

    expect(result.title).toBe('Ok');
    expect(db.insert).toHaveBeenCalled();
  });

  const scheduledRow = {
    id: apptId,
    organization_id: orgId,
    title: 'Visit',
    description: null,
    start_at: '2026-04-15 09:00:00.000',
    end_at: '2026-04-15 10:00:00.000',
    location: null,
    meeting_type: 'in_person',
    organizer_id: userId,
    customer_id: null,
    status: 'scheduled',
    created_at: '2026-04-01',
    updated_at: '2026-04-01',
    deleted_at: null,
  };

  it('transitions scheduled → completed', async () => {
    db.select
      .mockReturnValueOnce(thenable([scheduledRow]))
      .mockReturnValueOnce(
        thenable([{ ...scheduledRow, status: 'completed' }]),
      );

    const result = await service.transition(
      apptId,
      { toStatus: 'completed' },
      orgId,
    );

    expect(result.status).toBe('completed');
    expect(db.update).toHaveBeenCalled();
  });

  it('rejects illegal appointment transition', async () => {
    db.select.mockReturnValueOnce(
      thenable([{ ...scheduledRow, status: 'completed' }]),
    );

    await expect(
      service.transition(apptId, { toStatus: 'scheduled' }, orgId),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects update when reschedule overlaps another appointment', async () => {
    db.select
      .mockReturnValueOnce(thenable([scheduledRow]))
      .mockReturnValueOnce(
        thenable([{ id: userId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(
        thenable([{ id: 'other', title: 'Blocking slot' }]),
      );

    await expect(
      service.update(
        apptId,
        {
          startAt: '2026-04-15T09:30:00.000Z',
          endAt: '2026-04-15T10:30:00.000Z',
        },
        orgId,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});