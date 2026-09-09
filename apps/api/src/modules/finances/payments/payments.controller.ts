import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
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
  ConfirmPaymentDto,
  CreatePaymentDto,
  ListPaymentsQueryDto,
  PaymentResponseDto,
  UpdatePaymentDto,
} from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags(SWAGGER_TAG.Finances)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermissions('payments.read')
  @ApiOperation({
    summary: 'List payments',
    description: 'Filter status, customer, invoice; search reference.',
  })
  @ApiPaginatedResponse(PaymentResponseDto)
  findAll(
    @Query() query: ListPaymentsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<PaymentResponseDto>> {
    return this.paymentsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('payments.read')
  @ApiOperation({ summary: 'Get a payment' })
  @ApiOkResponse({ type: PaymentResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('payments.write')
  @ApiOperation({
    summary: 'Create a payment',
    description:
      'Defaults to pending. confirmImmediately applies invoice amount_paid + AR and optional SO link.',
  })
  @ApiCreatedResponse({ type: PaymentResponseDto })
  create(
    @Body() dto: CreatePaymentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('payments.write')
  @ApiOperation({
    summary: 'Update a pending payment',
    description: 'Only while status is pending.',
  })
  @ApiOkResponse({ type: PaymentResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.update(id, dto, organizationId, user);
  }

  @Post(':id/confirm')
  @RequirePermissions('payments.confirm')
  @ApiOperation({
    summary: 'Confirm a pending payment',
    description:
      'pending → confirmed. Updates invoice.amount_paid/status + AR; optional salesOrderPaymentId link.',
  })
  @ApiOkResponse({ type: PaymentResponseDto })
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmPaymentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.confirm(id, dto ?? {}, organizationId, user);
  }

  @Post(':id/reverse')
  @RequirePermissions('payments.confirm')
  @ApiOperation({
    summary: 'Reverse a confirmed payment',
    description:
      'confirmed → reversed. Rolls back invoice amount_paid/status + AR when invoice linked.',
  })
  @ApiOkResponse({ type: PaymentResponseDto })
  reverse(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.reverse(id, organizationId, user);
  }

  @Post(':id/fail')
  @RequirePermissions('payments.write')
  @ApiOperation({
    summary: 'Mark a pending payment as failed',
    description: 'pending → failed. No invoice/AR impact.',
  })
  @ApiOkResponse({ type: PaymentResponseDto })
  fail(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.markFailed(id, organizationId, user);
  }
}
