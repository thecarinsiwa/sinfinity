import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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
  CreateStockAdjustmentDto,
  ListStockAdjustmentsQueryDto,
  StockAdjustmentResponseDto,
} from './dto/stock-adjustment.dto';
import { StockAdjustmentsService } from './stock-adjustments.service';

@ApiTags(SWAGGER_TAG.Stock)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('stock-adjustments')
export class StockAdjustmentsController {
  constructor(
    private readonly stockAdjustmentsService: StockAdjustmentsService,
  ) {}

  @Get()
  @RequirePermissions('inventory.read')
  @ApiOperation({
    summary: 'List stock adjustments',
    description: 'Immutable audit of inventory corrections.',
  })
  @ApiPaginatedResponse(StockAdjustmentResponseDto)
  findAll(
    @Query() query: ListStockAdjustmentsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<StockAdjustmentResponseDto>> {
    return this.stockAdjustmentsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('inventory.read')
  @ApiOperation({ summary: 'Get a stock adjustment by id' })
  @ApiOkResponse({ type: StockAdjustmentResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<StockAdjustmentResponseDto> {
    return this.stockAdjustmentsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('inventory.adjust')
  @ApiOperation({
    summary: 'Create a stock adjustment',
    description:
      'Reads quantity_before from inventory, applies delta via applyMovement(adjustment). Immutable (no PATCH).',
  })
  @ApiCreatedResponse({ type: StockAdjustmentResponseDto })
  create(
    @Body() dto: CreateStockAdjustmentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<StockAdjustmentResponseDto> {
    return this.stockAdjustmentsService.create(dto, organizationId, user);
  }
}
