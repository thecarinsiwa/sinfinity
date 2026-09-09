import { NotFoundException } from '@nestjs/common';
import { CarriersService } from './carriers.service';

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

describe('CarriersService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const carrierId = '0191e6b8-4c3a-7b2d-9f1e-carriercarri';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const carrierRow = {
    id: carrierId,
    organization_id: orgId,
    name: 'Maersk',
    code: 'MAERSK',
    contact_email: 'ops@maersk.example',
    contact_phone: null as string | null,
    tracking_url_template: 'https://www.maersk.com/tracking/{trackingNumber}',
    is_active: 1,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  let service: CarriersService;
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
    service = new CarriersService(db as never);
  });

  it('creates a carrier with trackingUrlTemplate', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([carrierRow]));

    const result = await service.create(
      {
        name: 'Maersk',
        code: 'maersk',
        trackingUrlTemplate:
          'https://www.maersk.com/tracking/{trackingNumber}',
      },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalled();
    expect(result.code).toBe('MAERSK');
    expect(result.trackingUrlTemplate).toContain('{trackingNumber}');
    expect(result.isActive).toBe(true);
  });

  it('soft-deletes a carrier', async () => {
    db.select.mockReturnValueOnce(thenable([carrierRow]));

    await service.remove(carrierId, orgId, orgUser);
    expect(db.update).toHaveBeenCalled();
  });

  it('rejects when carrier is missing', async () => {
    db.select.mockReturnValueOnce(thenable([]));

    await expect(
      service.findOne(carrierId, orgId, orgUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
