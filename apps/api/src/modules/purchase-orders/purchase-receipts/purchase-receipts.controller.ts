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
import { ListPurchaseReceiptsQueryDto } from './dto/list-purchase-receipts-query.dto';
import {
  ConfirmPurchaseReceiptDto,
  CreatePurchaseReceiptDto,
  PurchaseReceiptResponseDto,
  UpdatePurchaseReceiptDto,
} from './dto/purchase-receipt.dto';
import { PurchaseReceiptsService } from './purchase-receipts.service';

@ApiTags(SWAGGER_TAG.Achats)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchase-receipts')
export class PurchaseReceiptsController {
  constructor(private readonly purchaseReceiptsService: PurchaseReceiptsService) {}

  @Get()
  @RequirePermissions('purchase_orders.read')
  @ApiOperation({
    summary: 'List purchase receipts',
    description: 'Search receiptNumber; filter by status and purchaseOrderId.',
  })
  @ApiPaginatedResponse(PurchaseReceiptResponseDto)
  findAll(
    @Query() query: ListPurchaseReceiptsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<PurchaseReceiptResponseDto>> {
    return this.purchaseReceiptsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('purchase_orders.read')
  @ApiOperation({ summary: 'Get a purchase receipt' })
  @ApiOkResponse({ type: PurchaseReceiptResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PurchaseReceiptResponseDto> {
    return this.purchaseReceiptsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('purchase_orders.write')
  @ApiOperation({
    summary: 'Create a purchase receipt (draft)',
    description:
      'Receipts are hard-deleted while draft; once confirmed they cannot be deleted.',
  })
  @ApiCreatedResponse({ type: PurchaseReceiptResponseDto })
  create(
    @Body() dto: CreatePurchaseReceiptDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PurchaseReceiptResponseDto> {
    return this.purchaseReceiptsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('purchase_orders.write')
  @ApiOperation({ summary: 'Update a purchase receipt (draft only)' })
  @ApiOkResponse({ type: PurchaseReceiptResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseReceiptDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PurchaseReceiptResponseDto> {
    return this.purchaseReceiptsService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('purchase_orders.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a purchase receipt (draft only)' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.purchaseReceiptsService.remove(id, organizationId, user);
  }

  @Post(':id/confirm')
  @RequirePermissions('purchase_orders.write')
  @ApiOperation({
    summary: 'Confirm a purchase receipt and update PO received quantities',
    description:
      'Body lines increment purchase_order_items.quantity_received (capped). Sets PO status to partial/received accordingly. Calls InventoryPort → applyMovement(in) when warehouseId is set.',
  })
  @ApiOkResponse({ type: PurchaseReceiptResponseDto })
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmPurchaseReceiptDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PurchaseReceiptResponseDto> {
    return this.purchaseReceiptsService.confirm(id, dto, organizationId, user);
  }
}

