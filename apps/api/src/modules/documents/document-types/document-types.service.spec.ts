import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DocumentTypesService } from './document-types.service';

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

describe('DocumentTypesService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const orgType = {
    id: '0191e6b8-4c3a-7b2d-9f1e-doctype00001',
    organization_id: orgId,
    code: 'CUSTOM_CERT',
    name: 'Customs certificate',
    allowed_mime_types: ['application/pdf'],
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
  };
  const systemType = {
    ...orgType,
    id: '0191e6b8-4c3a-7b2d-9f1e-doctypequote',
    organization_id: null as string | null,
    code: 'QUOTE',
    name: 'Quotation',
  };

  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  let service: DocumentTypesService;
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
    service = new DocumentTypesService(db as never);
  });

  it('lists document types for an organization', async () => {
    db.select
      .mockReturnValueOnce(thenable([orgType]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll(
      { page: 1, pageSize: 20, order: 'asc' },
      orgId,
      orgUser,
    );

    expect(result.data[0].code).toBe('CUSTOM_CERT');
    expect(result.data[0].isSystem).toBe(false);
    expect(result.data[0].allowedMimeTypes).toEqual(['application/pdf']);
  });

  it('requires organizationId on create', async () => {
    await expect(
      service.create({ code: 'X', name: 'X' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates an org document type', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([orgType]));

    const created = await service.create(
      {
        code: 'custom_cert',
        name: 'Customs certificate',
        allowedMimeTypes: ['application/pdf'],
      },
      orgId,
      orgUser,
    );

    expect(created.code).toBe('CUSTOM_CERT');
    expect(db.insert).toHaveBeenCalled();
  });

  it('forbids deleting system types', async () => {
    db.select.mockReturnValue(thenable([systemType]));

    await expect(
      service.remove(systemType.id, orgId, orgUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('forbids updating system types for non super-admin', async () => {
    db.select.mockReturnValue(thenable([systemType]));

    await expect(
      service.update(systemType.id, { name: 'X' }, orgId, orgUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns 404 for missing type', async () => {
    db.select.mockReturnValue(thenable([]));

    await expect(
      service.findOne(orgType.id, orgId, orgUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
