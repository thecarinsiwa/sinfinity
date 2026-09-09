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
  ApiConflictResponse,
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
  CreateProjectDto,
  CreateProjectItemDto,
  ListProjectsQueryDto,
  ProjectItemResponseDto,
  ProjectResponseDto,
  TransitionProjectDto,
  UpdateProjectDto,
  UpdateProjectItemDto,
} from './dto/project.dto';
import { ProjectsService } from './projects.service';

@ApiTags(SWAGGER_TAG.Projets)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @RequirePermissions('projects.read')
  @ApiOperation({
    summary: 'List projects',
    description:
      'Search projectNumber/name; filter status, customerId, salesOrderId.',
  })
  @ApiPaginatedResponse(ProjectResponseDto)
  findAll(
    @Query() query: ListProjectsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<ProjectResponseDto>> {
    return this.projectsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('projects.read')
  @ApiOperation({ summary: 'Get a project with its line items' })
  @ApiOkResponse({ type: ProjectResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('projects.write')
  @ApiOperation({
    summary: 'Create a planned project',
    description:
      'projectNumber unique per org. Optional salesOrderId must match customer.',
  })
  @ApiCreatedResponse({ type: ProjectResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateProjectDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('projects.write')
  @ApiOperation({
    summary: 'Update a project',
    description: 'Not allowed when completed or cancelled.',
  })
  @ApiOkResponse({ type: ProjectResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('projects.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete a project',
    description: 'Only planned or cancelled projects.',
  })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.projectsService.remove(id, organizationId, user);
  }

  @Post(':id/transition')
  @RequirePermissions('projects.write')
  @ApiOperation({
    summary: 'Transition project status',
    description:
      'Forward-only: planned → in_progress → on_hold|completed|cancelled.',
  })
  @ApiOkResponse({ type: ProjectResponseDto })
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionProjectDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.transition(id, dto, organizationId, user);
  }

  @Get(':id/items')
  @RequirePermissions('projects.read')
  @ApiOperation({ summary: 'List project line items' })
  @ApiOkResponse({ type: [ProjectItemResponseDto] })
  listItems(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProjectItemResponseDto[]> {
    return this.projectsService.listItems(id, organizationId, user);
  }

  @Post(':id/items')
  @RequirePermissions('projects.write')
  @ApiOperation({
    summary: 'Add a project line item',
    description: 'At least one of productId or serviceId required.',
  })
  @ApiCreatedResponse({ type: ProjectItemResponseDto })
  createItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProjectItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProjectItemResponseDto> {
    return this.projectsService.createItem(id, dto, organizationId, user);
  }

  @Patch(':id/items/:itemId')
  @RequirePermissions('projects.write')
  @ApiOperation({ summary: 'Update a project line item' })
  @ApiOkResponse({ type: ProjectItemResponseDto })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateProjectItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProjectItemResponseDto> {
    return this.projectsService.updateItem(
      id,
      itemId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions('projects.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a project line item' })
  @ApiNoContentResponse()
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.projectsService.removeItem(id, itemId, organizationId, user);
  }
}
