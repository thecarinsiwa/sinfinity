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
  CreateSalesOrderPaymentDto,
  SalesOrderPaymentResponseDto,
  UpdateSalesOrderPaymentDto,
} from './dto/sales-order-payment.dto';
import { SalesOrderPaymentsService } from './sales-order-payments.service';

@ApiTags(SWAGGER_TAG.CommandesClients)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sales-orders/:orderId/payments')
export class SalesOrderPaymentsController {
  constructor(
    private readonly salesOrderPaymentsService: SalesOrderPaymentsService,
  ) {}

  @Get()
  @RequirePermissions('sales_orders.read')
  @ApiOperation({
    summary: 'List sales order payments',
    description:
      'Commercial deposits / partials / balance notes. paymentId optional until finances module.',
  })
  @ApiOkResponse({ type: [SalesOrderPaymentResponseDto] })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  list(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SalesOrderPaymentResponseDto[]> {
    return this.salesOrderPaymentsService.list(orderId, organizationId, user);
  }

  @Post()
  @RequirePermissions('sales_orders.write')
  @ApiOperation({
    summary: 'Record a payment against a sales order',
    description: 'Hard-linked row; no sum-to-total validation.',
  })
  @ApiCreatedResponse({ type: SalesOrderPaymentResponseDto })
  create(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: CreateSalesOrderPaymentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SalesOrderPaymentResponseDto> {
    return this.salesOrderPaymentsService.create(
      orderId,
      dto,
      organizationId,
      user,
    );
  }

  @Patch(':paymentLinkId')
  @RequirePermissions('sales_orders.write')
  @ApiOperation({ summary: 'Update a sales order payment row' })
  @ApiOkResponse({ type: SalesOrderPaymentResponseDto })
  update(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('paymentLinkId', ParseUUIDPipe) paymentLinkId: string,
    @Body() dto: UpdateSalesOrderPaymentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SalesOrderPaymentResponseDto> {
    return this.salesOrderPaymentsService.update(
      orderId,
      paymentLinkId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':paymentLinkId')
  @RequirePermissions('sales_orders.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a sales order payment row' })
  @ApiNoContentResponse()
  remove(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('paymentLinkId', ParseUUIDPipe) paymentLinkId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.salesOrderPaymentsService.remove(
      orderId,
      paymentLinkId,
      organizationId,
      user,
    );
  }
}
