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
import { DeliveriesService } from './deliveries.service';
import {
  CreateDeliveryConfirmationDto,
  CreateDeliveryDto,
  CreateDeliveryItemDto,
  CreateDeliveryTrackingDto,
  DeliveryConfirmationResponseDto,
  DeliveryItemResponseDto,
  DeliveryResponseDto,
  DeliveryTrackingResponseDto,
  ListDeliveriesQueryDto,
  UpdateDeliveryDto,
  UpdateDeliveryItemDto,
} from './dto/delivery.dto';

@ApiTags(SWAGGER_TAG.Livraison)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  @RequirePermissions('deliveries.read')
  @ApiOperation({
    summary: 'List deliveries',
    description: 'Search deliveryNumber; filter status, salesOrderId, customer, warehouse.',
  })
  @ApiPaginatedResponse(DeliveryResponseDto)
  findAll(
    @Query() query: ListDeliveriesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<DeliveryResponseDto>> {
    return this.deliveriesService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('deliveries.read')
  @ApiOperation({ summary: 'Get a delivery with its line items' })
  @ApiOkResponse({ type: DeliveryResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DeliveryResponseDto> {
    return this.deliveriesService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('deliveries.write')
  @ApiOperation({
    summary: 'Create a planned delivery from a sales order',
    description: 'customerId must match the sales order customer. Add items separately.',
  })
  @ApiCreatedResponse({ type: DeliveryResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateDeliveryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DeliveryResponseDto> {
    return this.deliveriesService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('deliveries.write')
  @ApiOperation({
    summary: 'Update a planned delivery',
    description: 'Only planned deliveries can be updated.',
  })
  @ApiOkResponse({ type: DeliveryResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeliveryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DeliveryResponseDto> {
    return this.deliveriesService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('deliveries.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete a delivery',
    description: 'Only planned or cancelled deliveries.',
  })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.deliveriesService.remove(id, organizationId, user);
  }

  @Get(':id/items')
  @RequirePermissions('deliveries.read')
  @ApiOperation({ summary: 'List delivery line items' })
  @ApiOkResponse({ type: [DeliveryItemResponseDto] })
  listItems(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DeliveryItemResponseDto[]> {
    return this.deliveriesService.listItems(id, organizationId, user);
  }

  @Post(':id/items')
  @RequirePermissions('deliveries.write')
  @ApiOperation({
    summary: 'Add a delivery line item',
    description:
      'Linked to sales_order_item; quantity capped by remaining to deliver; serialNumberIds when serialized.',
  })
  @ApiCreatedResponse({ type: DeliveryItemResponseDto })
  createItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDeliveryItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DeliveryItemResponseDto> {
    return this.deliveriesService.createItem(id, dto, organizationId, user);
  }

  @Patch(':id/items/:itemId')
  @RequirePermissions('deliveries.write')
  @ApiOperation({ summary: 'Update a delivery line item (planned only)' })
  @ApiOkResponse({ type: DeliveryItemResponseDto })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateDeliveryItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DeliveryItemResponseDto> {
    return this.deliveriesService.updateItem(
      id,
      itemId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions('deliveries.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a delivery line item (planned only)' })
  @ApiNoContentResponse()
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.deliveriesService.removeItem(
      id,
      itemId,
      organizationId,
      user,
    );
  }

  @Post(':id/start')
  @RequirePermissions('deliveries.write')
  @ApiOperation({
    summary: 'Start a delivery',
    description: 'planned → in_transit. Requires at least one line item.',
  })
  @ApiOkResponse({ type: DeliveryResponseDto })
  start(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DeliveryResponseDto> {
    return this.deliveriesService.start(id, organizationId, user);
  }

  @Post(':id/complete')
  @RequirePermissions('deliveries.write')
  @ApiOperation({
    summary: 'Complete a delivery',
    description:
      'in_transit → delivered. applyMovement(out), increments quantity_delivered, updates SO to partially_delivered/delivered.',
  })
  @ApiOkResponse({ type: DeliveryResponseDto })
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DeliveryResponseDto> {
    return this.deliveriesService.complete(id, organizationId, user);
  }

  @Post(':id/fail')
  @RequirePermissions('deliveries.write')
  @ApiOperation({
    summary: 'Mark delivery as failed',
    description: 'From planned or in_transit. No stock movements.',
  })
  @ApiOkResponse({ type: DeliveryResponseDto })
  fail(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DeliveryResponseDto> {
    return this.deliveriesService.fail(id, organizationId, user);
  }

  @Post(':id/cancel')
  @RequirePermissions('deliveries.write')
  @ApiOperation({
    summary: 'Cancel a delivery',
    description: 'From planned or in_transit. No stock movements.',
  })
  @ApiOkResponse({ type: DeliveryResponseDto })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DeliveryResponseDto> {
    return this.deliveriesService.cancel(id, organizationId, user);
  }

  @Get(':id/tracking')
  @RequirePermissions('deliveries.read')
  @ApiOperation({
    summary: 'List delivery GPS / status timeline',
    description: 'Oldest first by recordedAt.',
  })
  @ApiOkResponse({ type: [DeliveryTrackingResponseDto] })
  listTracking(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DeliveryTrackingResponseDto[]> {
    return this.deliveriesService.listTracking(id, organizationId, user);
  }

  @Post(':id/tracking')
  @RequirePermissions('deliveries.write')
  @ApiOperation({
    summary: 'Append a tracking point',
    description:
      'GPS lat/long (optional, both or neither), locationLabel, free-form status. Allowed when in_transit or delivered.',
  })
  @ApiCreatedResponse({ type: DeliveryTrackingResponseDto })
  addTracking(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDeliveryTrackingDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DeliveryTrackingResponseDto> {
    return this.deliveriesService.addTracking(id, dto, organizationId, user);
  }

  @Get(':id/confirmations')
  @RequirePermissions('deliveries.read')
  @ApiOperation({
    summary: 'List delivery confirmations',
    description: 'Newest first; each includes linked proof_of_delivery rows.',
  })
  @ApiOkResponse({ type: [DeliveryConfirmationResponseDto] })
  listConfirmations(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DeliveryConfirmationResponseDto[]> {
    return this.deliveriesService.listConfirmations(
      id,
      organizationId,
      user,
    );
  }

  @Post(':id/confirmations')
  @RequirePermissions('deliveries.write')
  @ApiOperation({
    summary: 'Create a delivery confirmation (POD)',
    description:
      'accepted / accepted_with_remarks / rejected. Optional proofs with documentId (signature|photo|document). Allowed when delivered or failed.',
  })
  @ApiCreatedResponse({ type: DeliveryConfirmationResponseDto })
  createConfirmation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDeliveryConfirmationDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DeliveryConfirmationResponseDto> {
    return this.deliveriesService.createConfirmation(
      id,
      dto,
      organizationId,
      user,
    );
  }
}
