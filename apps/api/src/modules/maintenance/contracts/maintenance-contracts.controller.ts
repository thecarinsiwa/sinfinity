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
  CreateMaintenanceContractDto,
  CreateMaintenanceContractItemDto,
  CreateMaintenanceScheduleDto,
  ListMaintenanceContractsQueryDto,
  MaintenanceContractItemResponseDto,
  MaintenanceContractResponseDto,
  MaintenanceScheduleResponseDto,
  TransitionMaintenanceContractDto,
  UpdateMaintenanceContractDto,
  UpdateMaintenanceContractItemDto,
  UpdateMaintenanceScheduleDto,
} from './dto/maintenance-contract.dto';
import { MaintenanceContractsService } from './maintenance-contracts.service';

@ApiTags(SWAGGER_TAG.Maintenance)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('maintenance-contracts')
export class MaintenanceContractsController {
  constructor(
    private readonly maintenanceContractsService: MaintenanceContractsService,
  ) {}

  @Get()
  @RequirePermissions('maintenance.read')
  @ApiOperation({
    summary: 'List maintenance contracts',
    description: 'Search contractNumber; filter status, customerId.',
  })
  @ApiPaginatedResponse(MaintenanceContractResponseDto)
  findAll(
    @Query() query: ListMaintenanceContractsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<MaintenanceContractResponseDto>> {
    return this.maintenanceContractsService.findAll(
      query,
      organizationId,
      user,
    );
  }

  @Get(':id')
  @RequirePermissions('maintenance.read')
  @ApiOperation({ summary: 'Get a contract with items and schedules' })
  @ApiOkResponse({ type: MaintenanceContractResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<MaintenanceContractResponseDto> {
    return this.maintenanceContractsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('maintenance.write')
  @ApiOperation({
    summary: 'Create a draft maintenance contract',
    description: 'contractNumber unique per organization.',
  })
  @ApiCreatedResponse({ type: MaintenanceContractResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateMaintenanceContractDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<MaintenanceContractResponseDto> {
    return this.maintenanceContractsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('maintenance.write')
  @ApiOperation({
    summary: 'Update a maintenance contract',
    description: 'Not allowed when expired or cancelled.',
  })
  @ApiOkResponse({ type: MaintenanceContractResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaintenanceContractDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<MaintenanceContractResponseDto> {
    return this.maintenanceContractsService.update(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id')
  @RequirePermissions('maintenance.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete a maintenance contract',
    description: 'Only draft or cancelled.',
  })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.maintenanceContractsService.remove(id, organizationId, user);
  }

  @Post(':id/transition')
  @RequirePermissions('maintenance.write')
  @ApiOperation({
    summary: 'Transition contract status',
    description: 'draft → active → expired|cancelled.',
  })
  @ApiOkResponse({ type: MaintenanceContractResponseDto })
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionMaintenanceContractDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<MaintenanceContractResponseDto> {
    return this.maintenanceContractsService.transition(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Get(':id/items')
  @RequirePermissions('maintenance.read')
  @ApiOperation({ summary: 'List covered equipment items' })
  @ApiOkResponse({ type: [MaintenanceContractItemResponseDto] })
  listItems(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<MaintenanceContractItemResponseDto[]> {
    return this.maintenanceContractsService.listItems(id, organizationId, user);
  }

  @Post(':id/items')
  @RequirePermissions('maintenance.write')
  @ApiOperation({
    summary: 'Add covered equipment',
    description: 'Optional serialNumberId must match product and organization.',
  })
  @ApiCreatedResponse({ type: MaintenanceContractItemResponseDto })
  createItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMaintenanceContractItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<MaintenanceContractItemResponseDto> {
    return this.maintenanceContractsService.createItem(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Patch(':id/items/:itemId')
  @RequirePermissions('maintenance.write')
  @ApiOperation({ summary: 'Update a covered equipment item' })
  @ApiOkResponse({ type: MaintenanceContractItemResponseDto })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateMaintenanceContractItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<MaintenanceContractItemResponseDto> {
    return this.maintenanceContractsService.updateItem(
      id,
      itemId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions('maintenance.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a covered equipment item' })
  @ApiNoContentResponse()
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.maintenanceContractsService.removeItem(
      id,
      itemId,
      organizationId,
      user,
    );
  }

  @Get(':id/schedules')
  @RequirePermissions('maintenance.read')
  @ApiOperation({ summary: 'List preventive maintenance schedules' })
  @ApiOkResponse({ type: [MaintenanceScheduleResponseDto] })
  listSchedules(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<MaintenanceScheduleResponseDto[]> {
    return this.maintenanceContractsService.listSchedules(
      id,
      organizationId,
      user,
    );
  }

  @Post(':id/schedules')
  @RequirePermissions('maintenance.write')
  @ApiOperation({
    summary: 'Add a maintenance schedule',
    description: 'frequency: monthly | quarterly | yearly | custom.',
  })
  @ApiCreatedResponse({ type: MaintenanceScheduleResponseDto })
  createSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMaintenanceScheduleDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<MaintenanceScheduleResponseDto> {
    return this.maintenanceContractsService.createSchedule(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Patch(':id/schedules/:scheduleId')
  @RequirePermissions('maintenance.write')
  @ApiOperation({ summary: 'Update a maintenance schedule' })
  @ApiOkResponse({ type: MaintenanceScheduleResponseDto })
  updateSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @Body() dto: UpdateMaintenanceScheduleDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<MaintenanceScheduleResponseDto> {
    return this.maintenanceContractsService.updateSchedule(
      id,
      scheduleId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/schedules/:scheduleId')
  @RequirePermissions('maintenance.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a maintenance schedule' })
  @ApiNoContentResponse()
  removeSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.maintenanceContractsService.removeSchedule(
      id,
      scheduleId,
      organizationId,
      user,
    );
  }
}
