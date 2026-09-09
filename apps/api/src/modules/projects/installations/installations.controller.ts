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
  CurrentUser,
  ErrorResponseDto,
  JwtAuthGuard,
  OrganizationId,
  ParseUUIDPipe,
  PermissionsGuard,
  RequirePermissions,
  type AuthUser,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import {
  CreateInstallationDto,
  CreateInstallationItemDto,
  CreateInstallationTaskDto,
  InstallationItemResponseDto,
  InstallationResponseDto,
  InstallationTaskResponseDto,
  TransitionInstallationDto,
  UpdateInstallationDto,
  UpdateInstallationItemDto,
  UpdateInstallationTaskDto,
} from './dto/installation.dto';
import { InstallationsService } from './installations.service';

@ApiTags(SWAGGER_TAG.Projets)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects/:projectId/installations')
export class InstallationsController {
  constructor(private readonly installationsService: InstallationsService) {}

  @Get()
  @RequirePermissions('projects.read')
  @ApiOperation({ summary: 'List installations for a project' })
  @ApiOkResponse({ type: [InstallationResponseDto] })
  list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InstallationResponseDto[]> {
    return this.installationsService.listByProject(
      projectId,
      organizationId,
      user,
    );
  }

  @Post()
  @RequirePermissions('projects.write')
  @ApiOperation({
    summary: 'Create a planned installation under a project',
  })
  @ApiCreatedResponse({ type: InstallationResponseDto })
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateInstallationDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InstallationResponseDto> {
    return this.installationsService.create(
      projectId,
      dto,
      organizationId,
      user,
    );
  }

  @Get(':installationId')
  @RequirePermissions('projects.read')
  @ApiOperation({ summary: 'Get an installation with items and tasks' })
  @ApiOkResponse({ type: InstallationResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InstallationResponseDto> {
    return this.installationsService.findOne(
      projectId,
      installationId,
      organizationId,
      user,
    );
  }

  @Patch(':installationId')
  @RequirePermissions('projects.write')
  @ApiOperation({
    summary: 'Update an installation',
    description: 'Not allowed when completed or failed.',
  })
  @ApiOkResponse({ type: InstallationResponseDto })
  update(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @Body() dto: UpdateInstallationDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InstallationResponseDto> {
    return this.installationsService.update(
      projectId,
      installationId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':installationId')
  @RequirePermissions('projects.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an installation',
    description: 'Only planned or failed. Cascades items/tasks.',
  })
  @ApiNoContentResponse()
  remove(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.installationsService.remove(
      projectId,
      installationId,
      organizationId,
      user,
    );
  }

  @Post(':installationId/transition')
  @RequirePermissions('projects.write')
  @ApiOperation({
    summary: 'Transition installation status',
    description:
      'planned → ongoing → completed|failed. Sets completedAt on completed.',
  })
  @ApiOkResponse({ type: InstallationResponseDto })
  transition(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @Body() dto: TransitionInstallationDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InstallationResponseDto> {
    return this.installationsService.transition(
      projectId,
      installationId,
      dto,
      organizationId,
      user,
    );
  }

  @Get(':installationId/items')
  @RequirePermissions('projects.read')
  @ApiOperation({ summary: 'List installation line items' })
  @ApiOkResponse({ type: [InstallationItemResponseDto] })
  listItems(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InstallationItemResponseDto[]> {
    return this.installationsService.listItems(
      projectId,
      installationId,
      organizationId,
      user,
    );
  }

  @Post(':installationId/items')
  @RequirePermissions('projects.write')
  @ApiOperation({
    summary: 'Add an installation line item',
    description:
      'Serialized products require serialNumberId (status shipped) and quantity 1.',
  })
  @ApiCreatedResponse({ type: InstallationItemResponseDto })
  createItem(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @Body() dto: CreateInstallationItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InstallationItemResponseDto> {
    return this.installationsService.createItem(
      projectId,
      installationId,
      dto,
      organizationId,
      user,
    );
  }

  @Patch(':installationId/items/:itemId')
  @RequirePermissions('projects.write')
  @ApiOperation({ summary: 'Update an installation line item' })
  @ApiOkResponse({ type: InstallationItemResponseDto })
  updateItem(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateInstallationItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InstallationItemResponseDto> {
    return this.installationsService.updateItem(
      projectId,
      installationId,
      itemId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':installationId/items/:itemId')
  @RequirePermissions('projects.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an installation line item' })
  @ApiNoContentResponse()
  removeItem(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.installationsService.removeItem(
      projectId,
      installationId,
      itemId,
      organizationId,
      user,
    );
  }

  @Post(':installationId/items/:itemId/validate')
  @RequirePermissions('projects.write')
  @ApiOperation({
    summary: 'Validate an installation item',
    description:
      'Sets installedAt. For serialized products: serial shipped → installed in the same transaction.',
  })
  @ApiOkResponse({ type: InstallationItemResponseDto })
  validateItem(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InstallationItemResponseDto> {
    return this.installationsService.validateItem(
      projectId,
      installationId,
      itemId,
      organizationId,
      user,
    );
  }

  @Get(':installationId/tasks')
  @RequirePermissions('projects.read')
  @ApiOperation({ summary: 'List installation tasks' })
  @ApiOkResponse({ type: [InstallationTaskResponseDto] })
  listTasks(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InstallationTaskResponseDto[]> {
    return this.installationsService.listTasks(
      projectId,
      installationId,
      organizationId,
      user,
    );
  }

  @Post(':installationId/tasks')
  @RequirePermissions('projects.write')
  @ApiOperation({ summary: 'Create an installation task' })
  @ApiCreatedResponse({ type: InstallationTaskResponseDto })
  createTask(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @Body() dto: CreateInstallationTaskDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InstallationTaskResponseDto> {
    return this.installationsService.createTask(
      projectId,
      installationId,
      dto,
      organizationId,
      user,
    );
  }

  @Patch(':installationId/tasks/:taskId')
  @RequirePermissions('projects.write')
  @ApiOperation({
    summary: 'Update an installation task',
    description: 'Sets completedAt automatically when status becomes done.',
  })
  @ApiOkResponse({ type: InstallationTaskResponseDto })
  updateTask(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: UpdateInstallationTaskDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InstallationTaskResponseDto> {
    return this.installationsService.updateTask(
      projectId,
      installationId,
      taskId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':installationId/tasks/:taskId')
  @RequirePermissions('projects.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an installation task' })
  @ApiNoContentResponse()
  removeTask(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('installationId', ParseUUIDPipe) installationId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.installationsService.removeTask(
      projectId,
      installationId,
      taskId,
      organizationId,
      user,
    );
  }
}
