import type {
  CommentResponseDto,
  CommentThreadNodeDto,
} from './dto/comment.dto';

export type CommentRow = {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  author_id: string | null;
  body: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toCommentResponse(row: CommentRow): CommentResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    authorId: row.author_id,
    body: row.body,
    parentCommentId: row.parent_comment_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function buildCommentThread(
  rows: CommentRow[],
): CommentThreadNodeDto[] {
  const byParent = new Map<string | null, CommentRow[]>();
  for (const row of rows) {
    const key = row.parent_comment_id;
    const list = byParent.get(key) ?? [];
    list.push(row);
    byParent.set(key, list);
  }

  const sortRows = (list: CommentRow[]) =>
    [...list].sort(
      (a, b) =>
        a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
    );

  const walk = (parentId: string | null): CommentThreadNodeDto[] =>
    sortRows(byParent.get(parentId) ?? []).map((row) => ({
      id: row.id,
      authorId: row.author_id,
      body: row.body,
      parentCommentId: row.parent_comment_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      children: walk(row.id),
    }));

  return walk(null);
}
