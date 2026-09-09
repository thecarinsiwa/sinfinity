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
  CreateWarehouseLocationDto,
  ListWarehouseLocationsQueryDto,
  UpdateWarehouseLocationDto,
  WarehouseLocationResponseDto,
} from './dto/warehouse-location.dto';
import {
  CreateWarehouseDto,
  ListWarehousesQueryDto,
  UpdateWarehouseDto,
  WarehouseResponseDto,
} from './dto/warehouse.dto';
import { WarehousesService } from './warehouses.service';

@ApiTags(SWAGGER_TAG.Stock)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  @RequirePermissions('inventory.read')
  @ApiOperation({
    summary: 'List warehouses',
    description: 'Search code/name; filter branchId, isActive.',
  })
  @ApiPaginatedResponse(WarehouseResponseDto)
  findAll(
    @Query() query: ListWarehousesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<WarehouseResponseDto>> {
    return this.warehousesService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('inventory.read')
  @ApiOperation({ summary: 'Get a warehouse by id' })
  @ApiOkResponse({ type: WarehouseResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<WarehouseResponseDto> {
    return this.warehousesService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('inventory.adjust')
  @ApiOperation({
    summary: 'Create a warehouse',
    description: 'Optional branchId link. Code unique per organization.',
  })
  @ApiCreatedResponse({ type: WarehouseResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateWarehouseDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<WarehouseResponseDto> {
    return this.warehousesService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('inventory.adjust')
  @ApiOperation({ summary: 'Update a warehouse' })
  @ApiOkResponse({ type: WarehouseResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<WarehouseResponseDto> {
    return this.warehousesService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('inventory.adjust')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete a warehouse',
    description: 'Refused if inventory rows still reference the warehouse.',
  })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.warehousesService.remove(id, organizationId, user);
  }

  @Get(':id/locations')
  @RequirePermissions('inventory.read')
  @ApiOperation({
    summary: 'List warehouse locations',
    description: 'Codes like A-01-03.',
  })
  @ApiOkResponse({ type: [WarehouseLocationResponseDto] })
  listLocations(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListWarehouseLocationsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<WarehouseLocationResponseDto[]> {
    return this.warehousesService.listLocations(
      id,
      query,
      organizationId,
      user,
    );
  }

  @Post(':id/locations')
  @RequirePermissions('inventory.adjust')
  @ApiOperation({
    summary: 'Add a warehouse location',
    description: 'Code unique within warehouse (e.g. A-01-03).',
  })
  @ApiCreatedResponse({ type: WarehouseLocationResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  createLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateWarehouseLocationDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<WarehouseLocationResponseDto> {
    return this.warehousesService.createLocation(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Get(':id/locations/:locationId')
  @RequirePermissions('inventory.read')
  @ApiOperation({ summary: 'Get a warehouse location' })
  @ApiOkResponse({ type: WarehouseLocationResponseDto })
  findLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<WarehouseLocationResponseDto> {
    return this.warehousesService.findLocation(
      id,
      locationId,
      organizationId,
      user,
    );
  }

  @Patch(':id/locations/:locationId')
  @RequirePermissions('inventory.adjust')
  @ApiOperation({ summary: 'Update a warehouse location' })
  @ApiOkResponse({ type: WarehouseLocationResponseDto })
  updateLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Body() dto: UpdateWarehouseLocationDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<WarehouseLocationResponseDto> {
    return this.warehousesService.updateLocation(
      id,
      locationId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/locations/:locationId')
  @RequirePermissions('inventory.adjust')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete a warehouse location',
    description: 'Refused if inventory rows still reference the location.',
  })
  @ApiNoContentResponse()
  removeLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.warehousesService.removeLocation(
      id,
      locationId,
      organizationId,
      user,
    );
  }
}
