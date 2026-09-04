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
  ErrorResponseDto,
  JwtAuthGuard,
  OrganizationId,
  ParseUUIDPipe,
  PermissionsGuard,
  RequirePermissions,
  type PaginatedResponseDto,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { CreatePaymentTermDto } from './dto/create-payment-term.dto';
import { ListPaymentTermsQueryDto } from './dto/list-payment-terms-query.dto';
import { PaymentTermResponseDto } from './dto/payment-term-response.dto';
import { UpdatePaymentTermDto } from './dto/update-payment-term.dto';
import { PaymentTermsService } from './payment-terms.service';

@ApiTags('Settings')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('payment-terms')
export class PaymentTermsController {
  constructor(private readonly paymentTermsService: PaymentTermsService) {}

  @Get()
  @RequirePermissions('settings.read')
  @ApiOperation({
    summary: 'List payment terms',
    description:
      'Global + current org. Soft-deleted excluded. Suitable for UI selects.',
  })
  @ApiPaginatedResponse(PaymentTermResponseDto)
  findAll(
    @Query() query: ListPaymentTermsQueryDto,
    @OrganizationId() organizationId?: string,
  ): Promise<PaginatedResponseDto<PaymentTermResponseDto>> {
    return this.paymentTermsService.findAll(query, organizationId);
  }

  @Get(':id')
  @RequirePermissions('settings.read')
  @ApiOperation({ summary: 'Get a payment term by id' })
  @ApiOkResponse({ type: PaymentTermResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PaymentTermResponseDto> {
    return this.paymentTermsService.findOne(id);
  }

  @Post()
  @RequirePermissions('settings.write')
  @ApiOperation({ summary: 'Create a payment term' })
  @ApiCreatedResponse({ type: PaymentTermResponseDto })
  create(
    @Body() dto: CreatePaymentTermDto,
    @OrganizationId() organizationId?: string,
  ): Promise<PaymentTermResponseDto> {
    return this.paymentTermsService.create(dto, organizationId);
  }

  @Patch(':id')
  @RequirePermissions('settings.write')
  @ApiOperation({ summary: 'Update a payment term' })
  @ApiOkResponse({ type: PaymentTermResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentTermDto,
  ): Promise<PaymentTermResponseDto> {
    return this.paymentTermsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('settings.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a payment term' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.paymentTermsService.remove(id);
  }
}
