import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  asc,
  count,
  eq,
  isNull,
  type SQL,
} from 'drizzle-orm';
import {
  buildPaginatedResponse,
  createId,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { comments } from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../collaboration-scope';
import {
  CommentResponseDto,
  CommentThreadNodeDto,
  CreateCommentDto,
  ListCommentsQueryDto,
  ThreadCommentsQueryDto,
  UpdateCommentDto,
} from './dto/comment.dto';
import {
  buildCommentThread,
  toCommentResponse,
  type CommentRow,
} from './comments.mapper';

@Injectable()
export class CommentsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListCommentsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<CommentResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      entityType,
      entityId,
      authorId,
      rootsOnly,
      includeDeleted,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [eq(comments.organization_id, scopeOrgId)];
    if (!includeDeleted) {
      parts.push(isNull(comments.deleted_at));
    }
    if (entityType) parts.push(eq(comments.entity_type, entityType));
    if (entityId) parts.push(eq(comments.entity_id, entityId));
    if (authorId) parts.push(eq(comments.author_id, authorId));
    if (rootsOnly) {
      parts.push(isNull(comments.parent_comment_id));
    }
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(comments).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(comments)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(asc(comments.created_at), asc(comments.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as CommentRow[]).map(toCommentResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findThread(
    query: ThreadCommentsQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CommentThreadNodeDto[]> {
    const scopeOrgId = requireScopeOrgId(
      query.organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [
      eq(comments.organization_id, scopeOrgId),
      eq(comments.entity_type, query.entityType.trim()),
      eq(comments.entity_id, query.entityId),
    ];
    if (!query.includeDeleted) {
      parts.push(isNull(comments.deleted_at));
    }

    const rows = await this.db
      .select()
      .from(comments)
      .where(and(...parts)!)
      .orderBy(asc(comments.created_at), asc(comments.id));

    return buildCommentThread(rows as CommentRow[]);
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CommentResponseDto> {
    const row = await this.requireCommentAccess(
      id,
      currentOrganizationId,
      user,
    );
    return toCommentResponse(row);
  }

  async create(
    dto: CreateCommentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CommentResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'comment',
    );
    await ensureOrganizationExists(this.db, organizationId);

    const entityType = dto.entityType.trim();
    if (!entityType) {
      throw new BadRequestException('entityType is required');
    }
    const body = dto.body.trim();
    if (!body) {
      throw new BadRequestException('body is required');
    }

    if (dto.parentCommentId) {
      await this.assertParentCompatible(
        dto.parentCommentId,
        organizationId,
        entityType,
        dto.entityId,
      );
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(comments).values({
        id,
        organization_id: organizationId,
        entity_type: entityType,
        entity_id: dto.entityId,
        author_id: user?.id ?? null,
        body,
        parent_comment_id: dto.parentCommentId ?? null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid comment reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateCommentDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CommentResponseDto> {
    await this.requireCommentAccess(id, currentOrganizationId, user);
    const body = dto.body.trim();
    if (!body) {
      throw new BadRequestException('body is required');
    }

    await this.db
      .update(comments)
      .set({
        body,
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(comments.id, id));

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireCommentAccess(id, currentOrganizationId, user);
    await this.db
      .update(comments)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(comments.id, id));
  }

  private async assertParentCompatible(
    parentCommentId: string,
    organizationId: string,
    entityType: string,
    entityId: string,
  ): Promise<void> {
    const [parent] = await this.db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.id, parentCommentId),
          isNull(comments.deleted_at),
        ),
      )
      .limit(1);
    if (!parent) {
      throw new NotFoundException(
        `Parent comment ${parentCommentId} not found`,
      );
    }
    if (parent.organization_id !== organizationId) {
      throw new BadRequestException(
        'Parent comment must belong to the same organization',
      );
    }
    if (
      parent.entity_type !== entityType ||
      parent.entity_id !== entityId
    ) {
      throw new BadRequestException(
        'Parent comment must target the same entity',
      );
    }
  }

  private async requireCommentAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<CommentRow> {
    const [row] = await this.db
      .select()
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Comment ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'comment',
    );
    return row as CommentRow;
  }
}
