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
import { CreatePurchaseOrderFromQuoteDto } from './dto/create-purchase-order-from-quote.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ListPurchaseOrdersQueryDto } from './dto/list-purchase-orders-query.dto';
import {
  CreatePurchaseOrderItemDto,
  PurchaseOrderItemResponseDto,
  UpdatePurchaseOrderItemDto,
} from './dto/purchase-order-item.dto';
import { PurchaseOrderResponseDto } from './dto/purchase-order-response.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

@ApiTags(SWAGGER_TAG.Achats)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  @RequirePermissions('purchase_orders.read')
  @ApiOperation({
    summary: 'List purchase orders',
    description:
      'Search poNumber; filter status, supplier, procurement quote, buyer.',
  })
  @ApiPaginatedResponse(PurchaseOrderResponseDto)
  findAll(
    @Query() query: ListPurchaseOrdersQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<PurchaseOrderResponseDto>> {
    return this.purchaseOrdersService.findAll(query, organizationId, user);
  }

  @Post('from-quote')
  @RequirePermissions('purchase_orders.write')
  @ApiOperation({
    summary: 'Create a purchase order from a selected procurement quote',
    description:
      'Copies supplier, incoterm, currency, lines (qty/price). quantityReceived starts at 0. 409 if quote already linked.',
  })
  @ApiCreatedResponse({ type: PurchaseOrderResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  createFromQuote(
    @Body() dto: CreatePurchaseOrderFromQuoteDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PurchaseOrderResponseDto> {
    return this.purchaseOrdersService.createFromQuote(
      dto,
      organizationId,
      user,
    );
  }

  @Get(':id')
  @RequirePermissions('purchase_orders.read')
  @ApiOperation({ summary: 'Get a purchase order with its line items' })
  @ApiOkResponse({ type: PurchaseOrderResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PurchaseOrderResponseDto> {
    return this.purchaseOrdersService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('purchase_orders.write')
  @ApiOperation({
    summary: 'Create a purchase order',
    description:
      'Starts in draft. poNumber unique per org. Optional nested items; totals computed server-side.',
  })
  @ApiCreatedResponse({ type: PurchaseOrderResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreatePurchaseOrderDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PurchaseOrderResponseDto> {
    return this.purchaseOrdersService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('purchase_orders.write')
  @ApiOperation({
    summary: 'Update a purchase order header',
    description: 'Not allowed while closed or cancelled.',
  })
  @ApiOkResponse({ type: PurchaseOrderResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseOrderDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PurchaseOrderResponseDto> {
    return this.purchaseOrdersService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('purchase_orders.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a purchase order' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.purchaseOrdersService.remove(id, organizationId, user);
  }

  @Get(':id/items')
  @RequirePermissions('purchase_orders.read')
  @ApiOperation({ summary: 'List purchase order line items' })
  @ApiOkResponse({ type: [PurchaseOrderItemResponseDto] })
  listItems(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PurchaseOrderItemResponseDto[]> {
    return this.purchaseOrdersService.listItems(id, organizationId, user);
  }

  @Post(':id/items')
  @RequirePermissions('purchase_orders.write')
  @ApiOperation({
    summary: 'Add a line item',
    description: 'Draft only. lineTotal = qty × unitPrice.',
  })
  @ApiCreatedResponse({ type: PurchaseOrderItemResponseDto })
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePurchaseOrderItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PurchaseOrderItemResponseDto> {
    return this.purchaseOrdersService.addItem(id, dto, organizationId, user);
  }

  @Patch(':id/items/:itemId')
  @RequirePermissions('purchase_orders.write')
  @ApiOperation({ summary: 'Update a line item (draft only)' })
  @ApiOkResponse({ type: PurchaseOrderItemResponseDto })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdatePurchaseOrderItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PurchaseOrderItemResponseDto> {
    return this.purchaseOrdersService.updateItem(
      id,
      itemId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions('purchase_orders.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a line item (draft only)' })
  @ApiNoContentResponse()
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.purchaseOrdersService.removeItem(
      id,
      itemId,
      organizationId,
      user,
    );
  }
}
