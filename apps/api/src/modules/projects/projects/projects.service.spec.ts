import { BadRequestException, ConflictException } from '@nestjs/common';
import { ProjectsService } from './projects.service';

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

describe('ProjectsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const customerId = '0191e6b8-4c3a-7b2d-9f1e-custcustcustc';
  const soId = '0191e6b8-4c3a-7b2d-9f1e-sososososososo';
  const otherCustomerId = '0191e6b8-4c3a-7b2d-9f1e-otherotheroth';
  const projectId = '0191e6b8-4c3a-7b2d-9f1e-prjprjprjprjp';

  let service: ProjectsService;
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
    service = new ProjectsService(db as never);
  });

  it('rejects create when sales order customer does not match', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: customerId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: soId,
            organization_id: orgId,
            customer_id: otherCustomerId,
          },
        ]),
      );

    await expect(
      service.create(
        {
          organizationId: orgId,
          projectNumber: 'PRJ-1',
          name: 'Campus fibre',
          customerId,
          salesOrderId: soId,
        },
        orgId,
      ),
    ).rejects.toThrow(/Sales order customer must match/);
  });

  it('rejects create when project number already exists', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: customerId, organization_id: orgId }]),
      );
    db.insert.mockReturnValueOnce({
      values: jest
        .fn()
        .mockRejectedValue(Object.assign(new Error('dup'), { errno: 1062 })),
    });

    await expect(
      service.create(
        {
          organizationId: orgId,
          projectNumber: 'PRJ-1',
          name: 'Campus fibre',
          customerId,
        },
        orgId,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('transitions planned → in_progress', async () => {
    const planned = {
      id: projectId,
      organization_id: orgId,
      project_number: 'PRJ-1',
      name: 'Campus fibre',
      customer_id: customerId,
      sales_order_id: null,
      manager_user_id: null,
      start_date: null,
      end_date: null,
      status: 'planned' as const,
      site_address: null,
      description: null,
      created_at: '2026-01-01 00:00:00.000',
      updated_at: '2026-01-01 00:00:00.000',
      created_by: null,
      updated_by: null,
      deleted_at: null,
    };
    const inProgress = { ...planned, status: 'in_progress' as const };

    db.select
      .mockReturnValueOnce(thenable([planned]))
      .mockReturnValueOnce(thenable([inProgress]))
      .mockReturnValueOnce(thenable([]));

    const result = await service.transition(
      projectId,
      { toStatus: 'in_progress' },
      orgId,
    );
    expect(result.status).toBe('in_progress');
    expect(db.update).toHaveBeenCalled();
  });

  it('rejects invalid transition completed → cancelled', async () => {
    db.select.mockReturnValueOnce(
      thenable([
        {
          id: projectId,
          organization_id: orgId,
          project_number: 'PRJ-1',
          name: 'Campus fibre',
          customer_id: customerId,
          sales_order_id: null,
          manager_user_id: null,
          start_date: null,
          end_date: null,
          status: 'completed',
          site_address: null,
          description: null,
          created_at: '2026-01-01 00:00:00.000',
          updated_at: '2026-01-01 00:00:00.000',
          created_by: null,
          updated_by: null,
          deleted_at: null,
        },
      ]),
    );

    await expect(
      service.transition(projectId, { toStatus: 'cancelled' }, orgId),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
