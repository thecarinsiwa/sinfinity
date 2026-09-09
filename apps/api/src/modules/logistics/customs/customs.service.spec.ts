import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CustomsDeclarationsService } from './customs-declarations.service';
import { ImportDocumentsService } from './import-documents.service';

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

describe('CustomsDeclarationsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const declId = '0191e6b8-4c3a-7b2d-9f1e-decldecldecl';
  const shipmentId = '0191e6b8-4c3a-7b2d-9f1e-shipshipship';
  const docId = '0191e6b8-4c3a-7b2d-9f1e-docdocdocdoc';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const declRow = {
    id: declId,
    organization_id: orgId,
    shipment_id: shipmentId,
    declaration_number: 'D-2026-001',
    regime: 'DDP',
    declared_value: '15000.0000',
    currency_id: null as string | null,
    status: 'draft' as const,
    cleared_at: null as string | null,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  let service: CustomsDeclarationsService;
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
    service = new CustomsDeclarationsService(db as never);
  });

  it('creates a draft customs declaration', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([
          { id: shipmentId, organization_id: orgId, deleted_at: null },
        ]),
      )
      .mockReturnValueOnce(thenable([declRow]));

    const result = await service.create(
      {
        shipmentId,
        declarationNumber: 'D-2026-001',
        regime: 'DDP',
        declaredValue: '15000',
      },
      orgId,
      orgUser,
    );

    expect(result.status).toBe('draft');
    expect(result.declaredValue).toBe('15000.0000');
  });

  it('rejects document from another org', async () => {
    db.select
      .mockReturnValueOnce(thenable([declRow]))
      .mockReturnValueOnce(
        thenable([
          {
            id: docId,
            organization_id: 'other-org',
            status: 'ready',
            deleted_at: null,
          },
        ]),
      );

    await expect(
      service.addDocument(
        declId,
        { documentId: docId, docKind: 'sad' },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('soft-deletes a declaration', async () => {
    db.select.mockReturnValueOnce(thenable([declRow]));
    await service.remove(declId, orgId, orgUser);
    expect(db.update).toHaveBeenCalled();
  });
});

describe('ImportDocumentsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const shipmentId = '0191e6b8-4c3a-7b2d-9f1e-shipshipship';
  const docId = '0191e6b8-4c3a-7b2d-9f1e-docdocdocdoc';
  const linkId = '0191e6b8-4c3a-7b2d-9f1e-linklinklink';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  let service: ImportDocumentsService;
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
    service = new ImportDocumentsService(db as never);
  });

  it('links an import document with docKind bl', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([{ id: shipmentId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: docId,
            organization_id: orgId,
            status: 'ready',
            deleted_at: null,
          },
        ]),
      )
      .mockReturnValueOnce(
        thenable([{ id: shipmentId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: linkId,
            shipment_id: shipmentId,
            document_id: docId,
            doc_kind: 'bl',
            created_at: '2026-09-04 10:00:00.000',
          },
        ]),
      );

    const result = await service.create(
      shipmentId,
      { documentId: docId, docKind: 'bl' },
      orgId,
      orgUser,
    );

    expect(result.docKind).toBe('bl');
    expect(db.insert).toHaveBeenCalled();
  });

  it('rejects when shipment is missing', async () => {
    db.select.mockReturnValueOnce(thenable([]));

    await expect(
      service.create(
        shipmentId,
        { documentId: docId, docKind: 'invoice' },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
