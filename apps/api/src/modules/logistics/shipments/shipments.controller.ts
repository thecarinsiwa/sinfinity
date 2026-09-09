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
  CreateShipmentDto,
  CreateShipmentItemDto,
  CreateShipmentTrackingDto,
  ListShipmentsQueryDto,
  ShipmentItemResponseDto,
  ShipmentResponseDto,
  ShipmentTrackingResponseDto,
  TransitionShipmentDto,
  UpdateShipmentDto,
  UpdateShipmentItemDto,
  UpdateShipmentTrackingDto,
} from './dto/shipment.dto';
import { ShipmentsService } from './shipments.service';

@ApiTags(SWAGGER_TAG.Logistique)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get()
  @RequirePermissions('shipments.read')
  @ApiOperation({
    summary: 'List shipments',
    description: 'Search shipmentNumber; filter status, purchaseOrderId, carrierId.',
  })
  @ApiPaginatedResponse(ShipmentResponseDto)
  findAll(
    @Query() query: ListShipmentsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<ShipmentResponseDto>> {
    return this.shipmentsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('shipments.read')
  @ApiOperation({ summary: 'Get a shipment with its line items' })
  @ApiOkResponse({ type: ShipmentResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ShipmentResponseDto> {
    return this.shipmentsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('shipments.write')
  @ApiOperation({
    summary: 'Create a shipment linked to a purchase order',
    description:
      'Starts in booked. shipmentNumber unique/org. Optional nested items.',
  })
  @ApiCreatedResponse({ type: ShipmentResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateShipmentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ShipmentResponseDto> {
    return this.shipmentsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('shipments.write')
  @ApiOperation({
    summary: 'Update a shipment header',
    description: 'Not allowed while delivered or cancelled. ETD/ETA vs ATD/ATA.',
  })
  @ApiOkResponse({ type: ShipmentResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShipmentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ShipmentResponseDto> {
    return this.shipmentsService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('shipments.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a shipment' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.shipmentsService.remove(id, organizationId, user);
  }

  @Post(':id/transition')
  @RequirePermissions('shipments.write')
  @ApiOperation({
    summary: 'Transition shipment status',
    description:
      'Forward-only: booked → in_transit → arrived → cleared → delivered (+ cancelled until delivered). Writes a manual tracking event.',
  })
  @ApiOkResponse({ type: ShipmentResponseDto })
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionShipmentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ShipmentResponseDto> {
    return this.shipmentsService.transition(id, dto, organizationId, user);
  }

  @Get(':id/items')
  @RequirePermissions('shipments.read')
  @ApiOperation({ summary: 'List shipment line items' })
  @ApiOkResponse({ type: [ShipmentItemResponseDto] })
  listItems(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ShipmentItemResponseDto[]> {
    return this.shipmentsService.listItems(id, organizationId, user);
  }

  @Post(':id/items')
  @RequirePermissions('shipments.write')
  @ApiOperation({
    summary: 'Add a shipment line item',
    description: 'Requires purchaseOrderItemId and/or productId; weightKg/volumeCbm optional.',
  })
  @ApiCreatedResponse({ type: ShipmentItemResponseDto })
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateShipmentItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ShipmentItemResponseDto> {
    return this.shipmentsService.addItem(id, dto, organizationId, user);
  }

  @Patch(':id/items/:itemId')
  @RequirePermissions('shipments.write')
  @ApiOperation({ summary: 'Update a shipment line item' })
  @ApiOkResponse({ type: ShipmentItemResponseDto })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateShipmentItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ShipmentItemResponseDto> {
    return this.shipmentsService.updateItem(
      id,
      itemId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions('shipments.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a shipment line item' })
  @ApiNoContentResponse()
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.shipmentsService.removeItem(id, itemId, organizationId, user);
  }

  @Get(':id/tracking')
  @RequirePermissions('shipments.read')
  @ApiOperation({ summary: 'List shipment tracking events (oldest first)' })
  @ApiOkResponse({ type: [ShipmentTrackingResponseDto] })
  listTracking(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ShipmentTrackingResponseDto[]> {
    return this.shipmentsService.listTracking(id, organizationId, user);
  }

  @Post(':id/tracking')
  @RequirePermissions('shipments.write')
  @ApiOperation({
    summary: 'Add a tracking event',
    description: 'source: manual | api | carrier (default manual).',
  })
  @ApiCreatedResponse({ type: ShipmentTrackingResponseDto })
  addTracking(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateShipmentTrackingDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ShipmentTrackingResponseDto> {
    return this.shipmentsService.addTracking(id, dto, organizationId, user);
  }

  @Patch(':id/tracking/:eventId')
  @RequirePermissions('shipments.write')
  @ApiOperation({ summary: 'Update a tracking event' })
  @ApiOkResponse({ type: ShipmentTrackingResponseDto })
  updateTracking(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: UpdateShipmentTrackingDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ShipmentTrackingResponseDto> {
    return this.shipmentsService.updateTracking(
      id,
      eventId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/tracking/:eventId')
  @RequirePermissions('shipments.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a tracking event' })
  @ApiNoContentResponse()
  removeTracking(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.shipmentsService.removeTracking(
      id,
      eventId,
      organizationId,
      user,
    );
  }
}
