import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  CurrentUser,
  ErrorResponseDto,
  JwtAuthGuard,
  OrganizationId,
  ParseUUIDPipe,
  PermissionsGuard,
  RequirePermissions,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import {
  CreateTaskDto,
  ListTasksQueryDto,
  TaskResponseDto,
  TransitionTaskDto,
  UpdateTaskDto,
} from './dto/task.dto';
import { TasksService } from './tasks.service';

@ApiTags(SWAGGER_TAG.Collaboration)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @RequirePermissions('tasks.read')
  @ApiOperation({
    summary: 'List tasks',
    description:
      'Filter status, priority, assignee, entity; mine=true for current assignee.',
  })
  @ApiPaginatedResponse(TaskResponseDto)
  findAll(
    @Query() query: ListTasksQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<TaskResponseDto>> {
    return this.tasksService.findAll(query, organizationId, user);
  }

  @Get('my')
  @RequirePermissions('tasks.read')
  @ApiOperation({
    summary: 'List my tasks',
    description: 'Tasks assigned to the current user (same filters as list).',
  })
  @ApiPaginatedResponse(TaskResponseDto)
  findMy(
    @Query() query: ListTasksQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<TaskResponseDto>> {
    return this.tasksService.findMyTasks(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('tasks.read')
  @ApiOperation({ summary: 'Get a task' })
  @ApiOkResponse({ type: TaskResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<TaskResponseDto> {
    return this.tasksService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('tasks.write')
  @ApiOperation({
    summary: 'Create a task',
    description: 'Starts in todo. Optional assignee, dueAt, entity link.',
  })
  @ApiCreatedResponse({ type: TaskResponseDto })
  create(
    @Body() dto: CreateTaskDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<TaskResponseDto> {
    return this.tasksService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('tasks.write')
  @ApiOperation({
    summary: 'Update a task',
    description: 'Not while done or cancelled.',
  })
  @ApiOkResponse({ type: TaskResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<TaskResponseDto> {
    return this.tasksService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('tasks.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a task' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.tasksService.remove(id, organizationId, user);
  }

  @Post(':id/transition')
  @RequirePermissions('tasks.write')
  @ApiOperation({
    summary: 'Transition task status',
    description:
      'todo→in_progress|cancelled; in_progress→done|cancelled|todo. Sets completedAt on done.',
  })
  @ApiOkResponse({ type: TaskResponseDto })
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionTaskDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<TaskResponseDto> {
    return this.tasksService.transition(id, dto, organizationId, user);
  }
}
