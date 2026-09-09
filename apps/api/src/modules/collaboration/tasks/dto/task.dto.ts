import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from '../../task-statuses';

export class CreateTaskDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'Follow up delivery' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  assigneeId?: string | null;

  @ApiPropertyOptional({ enum: TASK_PRIORITIES, default: 'medium' })
  @IsOptional()
  @IsIn([...TASK_PRIORITIES])
  priority?: TaskPriority;

  @ApiPropertyOptional({
    example: '2026-04-15T17:00:00.000Z',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  dueAt?: string | null;

  @ApiPropertyOptional({
    example: 'sales_order',
    nullable: true,
    description: 'Polymorphic entity type when linked',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  entityType?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  entityId?: string | null;
}

export class UpdateTaskDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  assigneeId?: string | null;

  @ApiPropertyOptional({ enum: TASK_PRIORITIES })
  @IsOptional()
  @IsIn([...TASK_PRIORITIES])
  priority?: TaskPriority;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  dueAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  entityType?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  entityId?: string | null;
}

export class TransitionTaskDto {
  @ApiProperty({
    enum: TASK_STATUSES,
    description: 'todo→in_progress|cancelled; in_progress→done|cancelled|todo',
  })
  @IsIn([...TASK_STATUSES])
  toStatus!: TaskStatus;
}

export class ListTasksQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'delivery' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: TASK_STATUSES })
  @IsOptional()
  @IsIn([...TASK_STATUSES])
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TASK_PRIORITIES })
  @IsOptional()
  @IsIn([...TASK_PRIORITIES])
  priority?: TaskPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  assigneeId?: string;

  @ApiPropertyOptional({ example: 'sales_order' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  entityId?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Only tasks assigned to the current user',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  mine?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeDeleted?: boolean;
}

export class TaskResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  assigneeId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  createdBy!: string | null;

  @ApiProperty({ enum: TASK_PRIORITIES })
  priority!: TaskPriority;

  @ApiProperty({ enum: TASK_STATUSES })
  status!: TaskStatus;

  @ApiPropertyOptional({ nullable: true })
  dueAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  entityType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  entityId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  completedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  deletedAt!: string | null;
}
