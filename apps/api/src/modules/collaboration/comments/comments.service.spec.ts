import { BadRequestException } from '@nestjs/common';
import { buildCommentThread } from './comments.mapper';
import { CommentsService } from './comments.service';

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

describe('buildCommentThread', () => {
  it('nests replies under parents', () => {
    const root = {
      id: 'root',
      organization_id: 'org',
      entity_type: 'ticket',
      entity_id: 't1',
      author_id: 'u1',
      body: 'Root',
      parent_comment_id: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
      deleted_at: null,
    };
    const reply = {
      ...root,
      id: 'reply',
      body: 'Reply',
      parent_comment_id: 'root',
      created_at: '2026-01-02',
    };

    const tree = buildCommentThread([reply, root]);
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].body).toBe('Reply');
  });
});

describe('CommentsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const entityId = '0191e6b8-4c3a-7b2d-9f1e-ententententen';
  const parentId = '0191e6b8-4c3a-7b2d-9f1e-parentparentpa';
  const commentId = '0191e6b8-4c3a-7b2d-9f1e-cmtcmtcmtcmtcm';

  let service: CommentsService;
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
    service = new CommentsService(db as never);
  });

  it('rejects parent on a different entity', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([
          {
            id: parentId,
            organization_id: orgId,
            entity_type: 'ticket',
            entity_id: 'other-entity',
            deleted_at: null,
          },
        ]),
      );

    await expect(
      service.create(
        {
          organizationId: orgId,
          entityType: 'ticket',
          entityId,
          body: 'Reply',
          parentCommentId: parentId,
        },
        orgId,
      ),
    ).rejects.toThrow(/same entity/);
  });

  it('creates a reply when parent matches entity', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([
          {
            id: parentId,
            organization_id: orgId,
            entity_type: 'ticket',
            entity_id: entityId,
            deleted_at: null,
          },
        ]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: commentId,
            organization_id: orgId,
            entity_type: 'ticket',
            entity_id: entityId,
            author_id: null,
            body: 'Reply',
            parent_comment_id: parentId,
            created_at: '2026-01-02',
            updated_at: '2026-01-02',
            deleted_at: null,
          },
        ]),
      );

    const result = await service.create(
      {
        organizationId: orgId,
        entityType: 'ticket',
        entityId,
        body: 'Reply',
        parentCommentId: parentId,
      },
      orgId,
    );

    expect(result.parentCommentId).toBe(parentId);
    expect(db.insert).toHaveBeenCalled();
  });

  it('rejects empty body', async () => {
    db.select.mockReturnValueOnce(thenable([{ id: orgId }]));

    await expect(
      service.create(
        {
          organizationId: orgId,
          entityType: 'ticket',
          entityId,
          body: '   ',
        },
        orgId,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
