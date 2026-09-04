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
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { ListSalesOrdersQueryDto } from './dto/list-sales-orders-query.dto';
import {
  CreateSalesOrderItemDto,
  SalesOrderItemResponseDto,
  UpdateSalesOrderItemDto,
} from './dto/sales-order-item.dto';
import { SalesOrderResponseDto } from './dto/sales-order-response.dto';
import { SalesOrderStatusHistoryResponseDto } from './dto/sales-order-status-history.dto';
import { TransitionSalesOrderDto } from './dto/transition-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { SalesOrdersService } from './sales-orders.service';

@ApiTags(SWAGGER_TAG.CommandesClients)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sales-orders')
export class SalesOrdersController {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  @Get()
  @RequirePermissions('sales_orders.read')
  @ApiOperation({
    summary: 'List sales orders',
    description: 'Search orderNumber; filter status, customer, quotation, owner.',
  })
  @ApiPaginatedResponse(SalesOrderResponseDto)
  findAll(
    @Query() query: ListSalesOrdersQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<SalesOrderResponseDto>> {
    return this.salesOrdersService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('sales_orders.read')
  @ApiOperation({ summary: 'Get a sales order with its line items' })
  @ApiOkResponse({ type: SalesOrderResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SalesOrderResponseDto> {
    return this.salesOrdersService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('sales_orders.write')
  @ApiOperation({
    summary: 'Create a sales order',
    description:
      'Starts in pending. orderNumber unique per org. Optional nested items; totals computed server-side. quantityDelivered starts at 0.',
  })
  @ApiCreatedResponse({ type: SalesOrderResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateSalesOrderDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SalesOrderResponseDto> {
    return this.salesOrdersService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('sales_orders.write')
  @ApiOperation({
    summary: 'Update a sales order header',
    description: 'Allowed while pending or confirmed.',
  })
  @ApiOkResponse({ type: SalesOrderResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSalesOrderDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SalesOrderResponseDto> {
    return this.salesOrdersService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('sales_orders.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a sales order' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.salesOrdersService.remove(id, organizationId, user);
  }

  @Post(':id/transition')
  @RequirePermissions('sales_orders.write')
  @ApiOperation({
    summary: 'Transition sales order status',
    description:
      'Forward-only: pending → confirmed → in_progress → partially_delivered → delivered (+ cancelled except from delivered). Writes status history. Delivery statuses enforce quantityDelivered invariants.',
  })
  @ApiOkResponse({ type: SalesOrderResponseDto })
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionSalesOrderDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SalesOrderResponseDto> {
    return this.salesOrdersService.transition(id, dto, organizationId, user);
  }

  @Get(':id/status-history')
  @RequirePermissions('sales_orders.read')
  @ApiOperation({ summary: 'List sales order status history (oldest first)' })
  @ApiOkResponse({ type: [SalesOrderStatusHistoryResponseDto] })
  listStatusHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SalesOrderStatusHistoryResponseDto[]> {
    return this.salesOrdersService.listStatusHistory(
      id,
      organizationId,
      user,
    );
  }

  @Get(':id/items')
  @RequirePermissions('sales_orders.read')
  @ApiOperation({ summary: 'List sales order line items' })
  @ApiOkResponse({ type: [SalesOrderItemResponseDto] })
  listItems(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SalesOrderItemResponseDto[]> {
    return this.salesOrdersService.listItems(id, organizationId, user);
  }

  @Post(':id/items')
  @RequirePermissions('sales_orders.write')
  @ApiOperation({
    summary: 'Add a line item',
    description: 'Pending only. Totals recalculated server-side.',
  })
  @ApiCreatedResponse({ type: SalesOrderItemResponseDto })
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSalesOrderItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SalesOrderItemResponseDto> {
    return this.salesOrdersService.addItem(id, dto, organizationId, user);
  }

  @Patch(':id/items/:itemId')
  @RequirePermissions('sales_orders.write')
  @ApiOperation({
    summary: 'Update a line item',
    description:
      'Line content only while pending. quantityDelivered may be updated later (must not exceed quantity).',
  })
  @ApiOkResponse({ type: SalesOrderItemResponseDto })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateSalesOrderItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SalesOrderItemResponseDto> {
    return this.salesOrdersService.updateItem(
      id,
      itemId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions('sales_orders.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a line item (pending only)' })
  @ApiNoContentResponse()
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.salesOrdersService.removeItem(
      id,
      itemId,
      organizationId,
      user,
    );
  }
}
