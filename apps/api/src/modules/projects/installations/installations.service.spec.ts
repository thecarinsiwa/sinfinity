import { BadRequestException } from '@nestjs/common';
import { InstallationsService } from './installations.service';
import { INSTALLATION_STATUS } from '../installation-statuses';
import { SERIAL_NUMBER_STATUS } from '../../stock/serials/serial-number-statuses';

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

describe('InstallationsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const projectId = '0191e6b8-4c3a-7b2d-9f1e-prjprjprjprjp';
  const installationId = '0191e6b8-4c3a-7b2d-9f1e-instinstinsti';
  const itemId = '0191e6b8-4c3a-7b2d-9f1e-itemitemitemi';
  const productId = '0191e6b8-4c3a-7b2d-9f1e-prodprodprodp';
  const serialId = '0191e6b8-4c3a-7b2d-9f1e-sersersersers';

  const installation = {
    id: installationId,
    project_id: projectId,
    name: 'Baie A',
    site_location: null,
    scheduled_at: null,
    completed_at: null,
    status: INSTALLATION_STATUS.ONGOING,
    lead_technician_id: null,
    created_at: '2026-01-01 00:00:00.000',
    updated_at: '2026-01-01 00:00:00.000',
  };

  const itemBase = {
    id: itemId,
    installation_id: installationId,
    product_id: productId,
    serial_number_id: serialId,
    quantity: '1.0000',
    installed_at: null as string | null,
    notes: null,
    created_at: '2026-01-01 00:00:00.000',
    updated_at: '2026-01-01 00:00:00.000',
  };

  let service: InstallationsService;
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
    service = new InstallationsService(db as never);
  });

  function mockAccess(): void {
    db.select
      .mockReturnValueOnce(
        thenable([{ id: projectId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([installation]));
  }

  it('rejects validate when serial is not shipped', async () => {
    mockAccess();
    db.select
      .mockReturnValueOnce(
        thenable([{ id: projectId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([itemBase]))
      .mockReturnValueOnce(
        thenable([
          {
            id: productId,
            organization_id: orgId,
            is_serialized: 1,
          },
        ]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: serialId,
            status: SERIAL_NUMBER_STATUS.IN_STOCK,
            product_id: productId,
            organization_id: orgId,
          },
        ]),
      );

    await expect(
      service.validateItem(projectId, installationId, itemId, orgId),
    ).rejects.toThrow(/must be "shipped"/);
  });

  it('validates shipped serial → installed and sets installedAt', async () => {
    const installedItem = {
      ...itemBase,
      installed_at: '2026-01-02 12:00:00.000',
    };

    mockAccess();
    db.select
      .mockReturnValueOnce(
        thenable([{ id: projectId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([itemBase]))
      .mockReturnValueOnce(
        thenable([
          {
            id: productId,
            organization_id: orgId,
            is_serialized: 1,
          },
        ]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: serialId,
            status: SERIAL_NUMBER_STATUS.SHIPPED,
            product_id: productId,
            organization_id: orgId,
          },
        ]),
      )
      .mockReturnValueOnce(thenable([installedItem]));

    const result = await service.validateItem(
      projectId,
      installationId,
      itemId,
      orgId,
    );

    expect(result.installedAt).toBe('2026-01-02 12:00:00.000');
    expect(db.update).toHaveBeenCalled();
    const updateCalls = db.update.mock.calls.length;
    expect(updateCalls).toBeGreaterThanOrEqual(2);
  });

  it('rejects validate when item already validated', async () => {
    mockAccess();
    db.select
      .mockReturnValueOnce(
        thenable([{ id: projectId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            ...itemBase,
            installed_at: '2026-01-01 10:00:00.000',
          },
        ]),
      );

    await expect(
      service.validateItem(projectId, installationId, itemId, orgId),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('transitions planned → ongoing', async () => {
    const planned = {
      ...installation,
      status: INSTALLATION_STATUS.PLANNED,
    };
    const ongoing = {
      ...installation,
      status: INSTALLATION_STATUS.ONGOING,
    };

    db.select
      .mockReturnValueOnce(
        thenable([{ id: projectId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([planned]))
      .mockReturnValueOnce(
        thenable([{ id: projectId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([ongoing]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]));

    const result = await service.transition(
      projectId,
      installationId,
      { toStatus: 'ongoing' },
      orgId,
    );
    expect(result.status).toBe('ongoing');
  });
});
