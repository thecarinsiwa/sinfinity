import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SalesOrderDocumentsService } from './sales-order-documents.service';

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
  chain.set = jest.fn(self);
  chain.values = jest.fn(self);
  return chain;
}

describe('SalesOrderDocumentsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const orderId = '0191e6b8-4c3a-7b2d-9f1e-orderorderord';
  const documentId = '0191e6b8-4c3a-7b2d-9f1e-docdocdocdoc';
  const linkId = '0191e6b8-4c3a-7b2d-9f1e-linklinklink';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const linkRow = {
    id: linkId,
    sales_order_id: orderId,
    document_id: documentId,
    doc_kind: 'purchase_order',
    created_at: '2026-09-04 10:00:00.000',
  };

  let service: SalesOrderDocumentsService;
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
    service = new SalesOrderDocumentsService(db as never);
  });

  it('links a document to a sales order', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([{ id: orderId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: documentId,
            organization_id: orgId,
            status: 'active',
            deleted_at: null,
          },
        ]),
      )
      .mockReturnValueOnce(
        thenable([{ id: orderId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([linkRow]));

    const result = await service.create(
      orderId,
      { documentId, docKind: 'purchase_order' },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalled();
    expect(result.docKind).toBe('purchase_order');
  });

  it('rejects document from another organization', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([{ id: orderId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: documentId,
            organization_id: 'other-org',
            status: 'active',
            deleted_at: null,
          },
        ]),
      );

    await expect(
      service.create(orderId, { documentId }, orgId, orgUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects missing document', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([{ id: orderId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([]));

    await expect(
      service.create(orderId, { documentId }, orgId, orgUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
