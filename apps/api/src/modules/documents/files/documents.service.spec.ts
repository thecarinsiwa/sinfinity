import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';

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

describe('DocumentsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const row = {
    id: '0191e6b8-4c3a-7b2d-9f1e-docdocdocdoc',
    organization_id: orgId,
    document_type_id: null as string | null,
    title: 'Quote',
    file_name: 'quote.pdf',
    file_url: `${orgId}/2026/09/uuid-quote.pdf`,
    mime_type: 'application/pdf',
    file_size: 4,
    uploaded_by: 'user-1',
    checksum: 'x'.repeat(64),
    status: 'active' as const,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  let service: DocumentsService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
  };
  let storage: {
    put: jest.Mock;
    getStream: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
    };
    storage = {
      put: jest.fn().mockResolvedValue({ key: row.file_url, size: 4 }),
      getStream: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    service = new DocumentsService(db as never, storage as never);
  });

  it('rejects upload without file', async () => {
    await expect(
      service.upload(undefined, 'Title', undefined, orgId, orgUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uploads a document and creates version 1', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([row]));

    const created = await service.upload(
      {
        buffer: Buffer.from('%PDF'),
        originalname: 'quote.pdf',
        mimetype: 'application/pdf',
        size: 4,
      },
      'Quote',
      undefined,
      orgId,
      orgUser,
    );

    expect(storage.put).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalledTimes(2);
    expect(created.title).toBe('Quote');
    expect(created.fileName).toBe('quote.pdf');
  });

  it('rejects disallowed mime for typed upload', async () => {
    db.select.mockReturnValueOnce(thenable([{ id: orgId }])).mockReturnValueOnce(
      thenable([
        {
          id: 'type-1',
          organization_id: null,
          code: 'CONTRACT',
          allowed_mime_types: ['application/pdf'],
        },
      ]),
    );

    await expect(
      service.upload(
        {
          buffer: Buffer.from('img'),
          originalname: 'x.png',
          mimetype: 'image/png',
          size: 3,
        },
        'Img',
        'type-1',
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('soft-deletes a document', async () => {
    db.select.mockReturnValue(thenable([row]));

    await service.softDelete(row.id, orgId, orgUser);

    expect(db.update).toHaveBeenCalled();
  });

  it('returns 404 when document missing', async () => {
    db.select.mockReturnValue(thenable([]));

    await expect(
      service.findOne(row.id, orgId, orgUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
