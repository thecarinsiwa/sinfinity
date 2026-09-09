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
import {
  CreateRefundDto,
  ListRefundsQueryDto,
  RefundResponseDto,
  TransitionRefundDto,
  UpdateRefundDto,
} from './dto/refund.dto';
import { RefundsService } from './refunds.service';

@ApiTags(SWAGGER_TAG.Finances)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Get()
  @RequirePermissions('invoices.read')
  @ApiOperation({
    summary: 'List refunds (credit notes)',
    description: 'Filter status, invoice, customer.',
  })
  @ApiPaginatedResponse(RefundResponseDto)
  findAll(
    @Query() query: ListRefundsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<RefundResponseDto>> {
    return this.refundsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('invoices.read')
  @ApiOperation({ summary: 'Get a refund' })
  @ApiOkResponse({ type: RefundResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<RefundResponseDto> {
    return this.refundsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('invoices.write')
  @ApiOperation({
    summary: 'Create a draft refund',
    description: 'Linked to invoice + customer (same org).',
  })
  @ApiCreatedResponse({ type: RefundResponseDto })
  create(
    @Body() dto: CreateRefundDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<RefundResponseDto> {
    return this.refundsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('invoices.write')
  @ApiOperation({
    summary: 'Update a draft refund',
    description: 'Only while draft.',
  })
  @ApiOkResponse({ type: RefundResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRefundDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<RefundResponseDto> {
    return this.refundsService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('invoices.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a draft refund',
    description: 'Hard delete; only draft.',
  })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.refundsService.remove(id, organizationId, user);
  }

  @Post(':id/transition')
  @RequirePermissions('invoices.write')
  @ApiOperation({
    summary: 'Transition refund status',
    description:
      'draft→issued→applied. Applied reduces invoice total + AR (amount ≤ remaining).',
  })
  @ApiOkResponse({ type: RefundResponseDto })
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionRefundDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<RefundResponseDto> {
    return this.refundsService.transition(id, dto, organizationId, user);
  }
}
