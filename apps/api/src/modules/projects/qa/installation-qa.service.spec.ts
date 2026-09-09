import { InstallationQaService } from './installation-qa.service';

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

describe('InstallationQaService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const otherOrgId = '0191e6b8-4c3a-7b2d-9f1e-otherorgother';
  const projectId = '0191e6b8-4c3a-7b2d-9f1e-prjprjprjprjp';
  const installationId = '0191e6b8-4c3a-7b2d-9f1e-instinstinsti';
  const documentId = '0191e6b8-4c3a-7b2d-9f1e-docdocdocdocd';
  const userId = '0191e6b8-4c3a-7b2d-9f1e-useruseruseru';

  let service: InstallationQaService;
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
    service = new InstallationQaService(db as never);
  });

  it('rejects report when documentIds belong to another organization', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([{ id: projectId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([{ id: installationId }]))
      .mockReturnValueOnce(thenable([{ id: userId, organization_id: orgId }]))
      .mockReturnValueOnce(
        thenable([
          {
            id: documentId,
            organization_id: otherOrgId,
            deleted_at: null,
            status: 'active',
          },
        ]),
      );

    await expect(
      service.createReport(
        projectId,
        installationId,
        {
          summary: 'Site photos',
          documentIds: [documentId],
          authorUserId: userId,
        },
        orgId,
        { id: userId, organizationId: orgId, isSuperAdmin: false },
      ),
    ).rejects.toThrow(/Document must belong to the same organization/);
  });
});
