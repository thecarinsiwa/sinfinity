import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DocumentLinksService } from './document-links.service';

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
  chain.innerJoin = jest.fn(self);
  chain.values = jest.fn(self);
  return chain;
}

describe('DocumentLinksService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const docId = '0191e6b8-4c3a-7b2d-9f1e-docdocdocdoc';
  const linkId = '0191e6b8-4c3a-7b2d-9f1e-linklinklink';
  const entityId = '0191e6b8-4c3a-7b2d-9f1e-custcustcust';

  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const docRow = {
    id: docId,
    organization_id: orgId,
    status: 'active',
    deleted_at: null,
    title: 'Quote',
    file_name: 'quote.pdf',
    mime_type: 'application/pdf',
  };

  const joinRow = {
    id: linkId,
    document_id: docId,
    entity_type: 'customer',
    entity_id: entityId,
    role: 'attachment',
    created_at: '2026-09-04 10:00:00.000',
    document_title: 'Quote',
    document_file_name: 'quote.pdf',
    document_status: 'active',
    document_mime_type: 'application/pdf',
    organization_id: orgId,
  };

  let service: DocumentLinksService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      delete: jest.fn().mockReturnValue(thenable(undefined)),
    };
    service = new DocumentLinksService(db as never);
  });

  it('lists links for an entity', async () => {
    db.select
      .mockReturnValueOnce(thenable([joinRow]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findByEntity(
      {
        page: 1,
        pageSize: 20,
        entityType: 'customer',
        entityId,
      },
      orgId,
      orgUser,
    );

    expect(result.data).toHaveLength(1);
    expect(result.data[0].documentId).toBe(docId);
    expect(result.data[0].entityType).toBe('customer');
    expect(result.meta.total).toBe(1);
  });

  it('creates a link when document is in org', async () => {
    db.select
      .mockReturnValueOnce(thenable([docRow]))
      .mockReturnValueOnce(thenable([joinRow]));

    const result = await service.create(
      {
        documentId: docId,
        entityType: 'customer',
        entityId,
        role: 'attachment',
      },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalled();
    expect(result.id).toBe(linkId);
    expect(result.role).toBe('attachment');
  });

  it('rejects create when document is missing', async () => {
    db.select.mockReturnValueOnce(thenable([]));

    await expect(
      service.create(
        {
          documentId: docId,
          entityType: 'customer',
          entityId,
        },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps duplicate insert to ConflictException', async () => {
    db.select.mockReturnValueOnce(thenable([docRow]));
    db.insert.mockReturnValueOnce({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create(
        {
          documentId: docId,
          entityType: 'customer',
          entityId,
        },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects disallowed entity type at service layer', async () => {
    await expect(
      service.findByEntity(
        {
          page: 1,
          pageSize: 20,
          entityType: 'not_allowed' as never,
          entityId,
        },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deletes a link in scope', async () => {
    db.select.mockReturnValueOnce(
      thenable([{ linkId, organizationId: orgId, documentStatus: 'active' }]),
    );

    await service.remove(linkId, orgId, orgUser);
    expect(db.delete).toHaveBeenCalled();
  });

  it('throws when deleting unknown link', async () => {
    db.select.mockReturnValueOnce(thenable([]));

    await expect(service.remove(linkId, orgId, orgUser)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
