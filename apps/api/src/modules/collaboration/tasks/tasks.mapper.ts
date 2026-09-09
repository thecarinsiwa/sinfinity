import type { TaskPriority, TaskStatus } from '../task-statuses';
import type { TaskResponseDto } from './dto/task.dto';

export type TaskRow = {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  created_by: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_at: string | null;
  entity_type: string | null;
  entity_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function toMysqlDateTime(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.replace('T', ' ').replace('Z', '').slice(0, 23);
}

export function toTaskResponse(row: TaskRow): TaskResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    description: row.description,
    assigneeId: row.assignee_id,
    createdBy: row.created_by,
    priority: row.priority,
    status: row.status,
    dueAt: row.due_at,
    entityType: row.entity_type,
    entityId: row.entity_id,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export { toMysqlDateTime as taskDueAtToMysql };
