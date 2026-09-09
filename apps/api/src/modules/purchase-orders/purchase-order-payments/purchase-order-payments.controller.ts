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
  CreatePurchaseOrderPaymentDto,
  PurchaseOrderPaymentResponseDto,
  UpdatePurchaseOrderPaymentDto,
} from './dto/purchase-order-payment.dto';
import { PurchaseOrderPaymentsService } from './purchase-order-payments.service';

@ApiTags(SWAGGER_TAG.Achats)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('purchase-orders/:orderId/payments')
export class PurchaseOrderPaymentsController {
  constructor(
    private readonly purchaseOrderPaymentsService: PurchaseOrderPaymentsService,
  ) {}

  @Get()
  @RequirePermissions('purchase_orders.read')
  @ApiOperation({
    summary: 'List purchase order payments',
    description:
      'Supplier payments (TT/LC/Mobile Money via paymentMethodId). No accounts_payable creation (Phase 17). No sum-to-total validation.',
  })
  @ApiOkResponse({ type: [PurchaseOrderPaymentResponseDto] })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  list(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PurchaseOrderPaymentResponseDto[]> {
    return this.purchaseOrderPaymentsService.list(
      orderId,
      organizationId,
      user,
    );
  }

  @Post()
  @RequirePermissions('purchase_orders.write')
  @ApiOperation({
    summary: 'Record a payment against a purchase order',
    description:
      'Hard-linked row. Does not create accounts_payable (TODO Phase 17).',
  })
  @ApiCreatedResponse({ type: PurchaseOrderPaymentResponseDto })
  create(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: CreatePurchaseOrderPaymentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PurchaseOrderPaymentResponseDto> {
    return this.purchaseOrderPaymentsService.create(
      orderId,
      dto,
      organizationId,
      user,
    );
  }

  @Patch(':paymentId')
  @RequirePermissions('purchase_orders.write')
  @ApiOperation({ summary: 'Update a purchase order payment' })
  @ApiOkResponse({ type: PurchaseOrderPaymentResponseDto })
  update(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() dto: UpdatePurchaseOrderPaymentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PurchaseOrderPaymentResponseDto> {
    return this.purchaseOrderPaymentsService.update(
      orderId,
      paymentId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':paymentId')
  @RequirePermissions('purchase_orders.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a purchase order payment' })
  @ApiNoContentResponse()
  remove(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.purchaseOrderPaymentsService.remove(
      orderId,
      paymentId,
      organizationId,
      user,
    );
  }
}
