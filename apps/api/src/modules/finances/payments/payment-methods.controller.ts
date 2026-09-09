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
  CreatePaymentMethodDto,
  ListPaymentMethodsQueryDto,
  PaymentMethodResponseDto,
  UpdatePaymentMethodDto,
} from './dto/payment-method.dto';
import { PaymentMethodsService } from './payment-methods.service';

@ApiTags(SWAGGER_TAG.Finances)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(
    private readonly paymentMethodsService: PaymentMethodsService,
  ) {}

  @Get()
  @RequirePermissions('payments.read')
  @ApiOperation({
    summary: 'List payment methods',
    description: 'Codes like CASH, BANK, MOBILE_MONEY, WIRE (varchar).',
  })
  @ApiPaginatedResponse(PaymentMethodResponseDto)
  findAll(
    @Query() query: ListPaymentMethodsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<PaymentMethodResponseDto>> {
    return this.paymentMethodsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('payments.read')
  @ApiOperation({ summary: 'Get a payment method' })
  @ApiOkResponse({ type: PaymentMethodResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaymentMethodResponseDto> {
    return this.paymentMethodsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('payments.write')
  @ApiOperation({
    summary: 'Create a payment method',
    description: 'code unique per organization (stored uppercase).',
  })
  @ApiCreatedResponse({ type: PaymentMethodResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreatePaymentMethodDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaymentMethodResponseDto> {
    return this.paymentMethodsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('payments.write')
  @ApiOperation({ summary: 'Update a payment method' })
  @ApiOkResponse({ type: PaymentMethodResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentMethodDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaymentMethodResponseDto> {
    return this.paymentMethodsService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('payments.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deactivate a payment method',
    description: 'Soft rule: sets isActive=false (no hard delete).',
  })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.paymentMethodsService.remove(id, organizationId, user);
  }
}
