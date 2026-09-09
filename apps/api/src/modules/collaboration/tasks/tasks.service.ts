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
  desc,
  eq,
  isNull,
  like,
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
import { tasks, users } from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import {
  assertOrgAccess,
  ensureOrganizationExists,
  requireOrgId,
  requireScopeOrgId,
} from '../collaboration-scope';
import {
  assertTaskTransition,
  TASK_PRIORITY,
  TASK_STATUS,
  type TaskStatus,
} from '../task-statuses';
import {
  CreateTaskDto,
  ListTasksQueryDto,
  TaskResponseDto,
  TransitionTaskDto,
  UpdateTaskDto,
} from './dto/task.dto';
import {
  taskDueAtToMysql,
  toTaskResponse,
  type TaskRow,
} from './tasks.mapper';

@Injectable()
export class TasksService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    query: ListTasksQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<TaskResponseDto>> {
    const {
      page,
      pageSize,
      organizationId,
      search,
      status,
      priority,
      assigneeId,
      entityType,
      entityId,
      mine,
      includeDeleted,
    } = query;
    const scopeOrgId = requireScopeOrgId(
      organizationId,
      currentOrganizationId,
      user,
    );
    const parts: SQL[] = [eq(tasks.organization_id, scopeOrgId)];
    if (!includeDeleted) {
      parts.push(isNull(tasks.deleted_at));
    }
    if (search?.trim()) {
      parts.push(like(tasks.title, `%${search.trim()}%`));
    }
    if (status) parts.push(eq(tasks.status, status));
    if (priority) parts.push(eq(tasks.priority, priority));
    if (mine) {
      if (!user?.id) {
        throw new BadRequestException(
          'Authenticated user is required for mine filter',
        );
      }
      parts.push(eq(tasks.assignee_id, user.id));
    } else if (assigneeId) {
      parts.push(eq(tasks.assignee_id, assigneeId));
    }
    if (entityType) parts.push(eq(tasks.entity_type, entityType));
    if (entityId) parts.push(eq(tasks.entity_id, entityId));
    const where = and(...parts)!;
    const offset = (page - 1) * pageSize;

    const listQuery = this.db.select().from(tasks).$dynamic();
    const countQuery = this.db
      .select({ total: count() })
      .from(tasks)
      .$dynamic();
    listQuery.where(where);
    countQuery.where(where);

    const [rows, [totalRow]] = await Promise.all([
      listQuery
        .orderBy(desc(tasks.created_at), asc(tasks.id))
        .limit(pageSize)
        .offset(offset),
      countQuery,
    ]);

    return buildPaginatedResponse(
      (rows as TaskRow[]).map(toTaskResponse),
      Number(totalRow?.total ?? 0),
      page,
      pageSize,
    );
  }

  async findMyTasks(
    query: ListTasksQueryDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<PaginatedResponseDto<TaskResponseDto>> {
    return this.findAll(
      { ...query, mine: true },
      currentOrganizationId,
      user,
    );
  }

  async findOne(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<TaskResponseDto> {
    const row = await this.requireTaskAccess(
      id,
      currentOrganizationId,
      user,
    );
    return toTaskResponse(row);
  }

  async create(
    dto: CreateTaskDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<TaskResponseDto> {
    const organizationId = requireOrgId(
      dto.organizationId,
      currentOrganizationId,
      user,
      'task',
    );
    await ensureOrganizationExists(this.db, organizationId);
    this.assertEntityLink(dto.entityType, dto.entityId);
    if (dto.assigneeId) {
      await this.ensureUserInOrg(dto.assigneeId, organizationId);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(tasks).values({
        id,
        organization_id: organizationId,
        title: dto.title.trim(),
        description: dto.description ?? null,
        assignee_id: dto.assigneeId ?? null,
        created_by: user?.id ?? null,
        priority: dto.priority ?? TASK_PRIORITY.MEDIUM,
        status: TASK_STATUS.TODO,
        due_at: taskDueAtToMysql(dto.dueAt),
        entity_type: dto.entityType ?? null,
        entity_id: dto.entityId ?? null,
        completed_at: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid task reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<TaskResponseDto> {
    const existing = await this.requireTaskAccess(
      id,
      currentOrganizationId,
      user,
    );
    if (
      existing.status === TASK_STATUS.DONE ||
      existing.status === TASK_STATUS.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot update a task in status "${existing.status}"`,
      );
    }

    const entityType =
      dto.entityType !== undefined ? dto.entityType : existing.entity_type;
    const entityId =
      dto.entityId !== undefined ? dto.entityId : existing.entity_id;
    this.assertEntityLink(entityType, entityId);

    if (dto.assigneeId) {
      await this.ensureUserInOrg(dto.assigneeId, existing.organization_id);
    }

    const patch: Partial<{
      title: string;
      description: string | null;
      assignee_id: string | null;
      priority: typeof existing.priority;
      due_at: string | null;
      entity_type: string | null;
      entity_id: string | null;
      updated_at: string;
    }> = {
      updated_at: nowMysqlDateTime(),
    };

    if (dto.title !== undefined) patch.title = dto.title.trim();
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.assigneeId !== undefined) patch.assignee_id = dto.assigneeId;
    if (dto.priority !== undefined) patch.priority = dto.priority;
    if (dto.dueAt !== undefined) patch.due_at = taskDueAtToMysql(dto.dueAt);
    if (dto.entityType !== undefined) patch.entity_type = dto.entityType;
    if (dto.entityId !== undefined) patch.entity_id = dto.entityId;

    try {
      await this.db.update(tasks).set(patch).where(eq(tasks.id, id));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid task reference');
    }

    return this.findOne(id, currentOrganizationId, user);
  }

  async remove(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.requireTaskAccess(id, currentOrganizationId, user);
    await this.db
      .update(tasks)
      .set({
        deleted_at: nowMysqlDateTime(),
        updated_at: nowMysqlDateTime(),
      })
      .where(eq(tasks.id, id));
  }

  async transition(
    id: string,
    dto: TransitionTaskDto,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<TaskResponseDto> {
    const existing = await this.requireTaskAccess(
      id,
      currentOrganizationId,
      user,
    );
    try {
      assertTaskTransition(existing.status, dto.toStatus);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid status transition',
      );
    }

    const now = nowMysqlDateTime();
    const patch: Partial<{
      status: TaskStatus;
      completed_at: string | null;
      updated_at: string;
    }> = {
      status: dto.toStatus,
      updated_at: now,
    };

    if (dto.toStatus === TASK_STATUS.DONE) {
      patch.completed_at = now;
    } else {
      patch.completed_at = null;
    }

    await this.db.update(tasks).set(patch).where(eq(tasks.id, id));
    return this.findOne(id, currentOrganizationId, user);
  }

  private assertEntityLink(
    entityType: string | null | undefined,
    entityId: string | null | undefined,
  ): void {
    const hasType = entityType != null && entityType !== '';
    const hasId = entityId != null && entityId !== '';
    if (hasType !== hasId) {
      throw new BadRequestException(
        'entityType and entityId must be provided together',
      );
    }
  }

  private async requireTaskAccess(
    id: string,
    currentOrganizationId?: string,
    user?: AuthUser,
  ): Promise<TaskRow> {
    const [row] = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    assertOrgAccess(
      row.organization_id,
      currentOrganizationId,
      user,
      'task',
    );
    return row as TaskRow;
  }

  private async ensureUserInOrg(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: users.id, organization_id: users.organization_id })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deleted_at)))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Assignee must belong to the same organization',
      );
    }
  }
}
