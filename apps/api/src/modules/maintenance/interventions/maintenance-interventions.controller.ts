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
  CreateMaintenanceInterventionDto,
  CreateMaintenanceReportDto,
  ListMaintenanceInterventionsQueryDto,
  MaintenanceInterventionResponseDto,
  MaintenanceReportResponseDto,
  TransitionMaintenanceInterventionDto,
  UpdateMaintenanceInterventionDto,
  UpdateMaintenanceReportDto,
} from './dto/maintenance-intervention.dto';
import { MaintenanceInterventionsService } from './maintenance-interventions.service';

@ApiTags(SWAGGER_TAG.Maintenance)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('maintenance-interventions')
export class MaintenanceInterventionsController {
  constructor(
    private readonly interventionsService: MaintenanceInterventionsService,
  ) {}

  @Get()
  @RequirePermissions('maintenance.read')
  @ApiOperation({
    summary: 'List maintenance interventions',
    description:
      'Filter status, type, customer, ticket, contract, schedule, technician.',
  })
  @ApiPaginatedResponse(MaintenanceInterventionResponseDto)
  findAll(
    @Query() query: ListMaintenanceInterventionsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<MaintenanceInterventionResponseDto>> {
    return this.interventionsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('maintenance.read')
  @ApiOperation({ summary: 'Get an intervention with its reports' })
  @ApiOkResponse({ type: MaintenanceInterventionResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<MaintenanceInterventionResponseDto> {
    return this.interventionsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('maintenance.write')
  @ApiOperation({
    summary: 'Create a planned intervention',
    description:
      'Optional ticketId / scheduleId / contractId must match customer and org.',
  })
  @ApiCreatedResponse({ type: MaintenanceInterventionResponseDto })
  create(
    @Body() dto: CreateMaintenanceInterventionDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<MaintenanceInterventionResponseDto> {
    return this.interventionsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('maintenance.write')
  @ApiOperation({
    summary: 'Update an intervention',
    description: 'Only while planned.',
  })
  @ApiOkResponse({ type: MaintenanceInterventionResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaintenanceInterventionDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<MaintenanceInterventionResponseDto> {
    return this.interventionsService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('maintenance.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an intervention',
    description: 'Only planned or cancelled. Cascades reports.',
  })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.interventionsService.remove(id, organizationId, user);
  }

  @Post(':id/transition')
  @RequirePermissions('maintenance.write')
  @ApiOperation({
    summary: 'Transition intervention status',
    description: 'planned → done|cancelled. Sets endedAt on done.',
  })
  @ApiOkResponse({ type: MaintenanceInterventionResponseDto })
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionMaintenanceInterventionDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<MaintenanceInterventionResponseDto> {
    return this.interventionsService.transition(id, dto, organizationId, user);
  }

  @Get(':id/reports')
  @RequirePermissions('maintenance.read')
  @ApiOperation({ summary: 'List intervention reports' })
  @ApiOkResponse({ type: [MaintenanceReportResponseDto] })
  listReports(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<MaintenanceReportResponseDto[]> {
    return this.interventionsService.listReports(id, organizationId, user);
  }

  @Post(':id/reports')
  @RequirePermissions('maintenance.write')
  @ApiOperation({
    summary: 'Create an intervention report',
    description:
      'partsUsed is free-form JSON; documentIds must belong to the org.',
  })
  @ApiCreatedResponse({ type: MaintenanceReportResponseDto })
  createReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMaintenanceReportDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<MaintenanceReportResponseDto> {
    return this.interventionsService.createReport(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Get(':id/reports/:reportId')
  @RequirePermissions('maintenance.read')
  @ApiOperation({ summary: 'Get an intervention report' })
  @ApiOkResponse({ type: MaintenanceReportResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<MaintenanceReportResponseDto> {
    return this.interventionsService.findReport(
      id,
      reportId,
      organizationId,
      user,
    );
  }

  @Patch(':id/reports/:reportId')
  @RequirePermissions('maintenance.write')
  @ApiOperation({
    summary: 'Update an intervention report',
    description:
      'Only summary, actionsTaken, partsUsed, documentIds (no updated_at column).',
  })
  @ApiOkResponse({ type: MaintenanceReportResponseDto })
  updateReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() dto: UpdateMaintenanceReportDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<MaintenanceReportResponseDto> {
    return this.interventionsService.updateReport(
      id,
      reportId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/reports/:reportId')
  @RequirePermissions('maintenance.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an intervention report' })
  @ApiNoContentResponse()
  removeReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.interventionsService.removeReport(
      id,
      reportId,
      organizationId,
      user,
    );
  }
}
