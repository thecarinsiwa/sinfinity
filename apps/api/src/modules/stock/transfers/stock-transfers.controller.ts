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
  ApiConflictResponse,
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
  CreateStockTransferDto,
  ListStockTransfersQueryDto,
  StockTransferResponseDto,
  TransitionStockTransferDto,
  UpdateStockTransferDto,
} from './dto/stock-transfer.dto';
import { StockTransfersService } from './stock-transfers.service';

@ApiTags(SWAGGER_TAG.Stock)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('stock-transfers')
export class StockTransfersController {
  constructor(private readonly stockTransfersService: StockTransfersService) {}

  @Get()
  @RequirePermissions('inventory.read')
  @ApiOperation({
    summary: 'List stock transfers',
    description: 'Filter by status, warehouses; search transfer number.',
  })
  @ApiPaginatedResponse(StockTransferResponseDto)
  findAll(
    @Query() query: ListStockTransfersQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<StockTransferResponseDto>> {
    return this.stockTransfersService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('inventory.read')
  @ApiOperation({ summary: 'Get a stock transfer by id' })
  @ApiOkResponse({ type: StockTransferResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<StockTransferResponseDto> {
    return this.stockTransfersService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('inventory.adjust')
  @ApiOperation({
    summary: 'Create a draft stock transfer',
    description:
      'Header only. Lines are supplied on draft→in_transit transition.',
  })
  @ApiCreatedResponse({ type: StockTransferResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateStockTransferDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<StockTransferResponseDto> {
    return this.stockTransfersService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('inventory.adjust')
  @ApiOperation({
    summary: 'Update a draft stock transfer',
    description: 'Only draft transfers can be updated.',
  })
  @ApiOkResponse({ type: StockTransferResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockTransferDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<StockTransferResponseDto> {
    return this.stockTransfersService.update(id, dto, organizationId, user);
  }

  @Post(':id/transition')
  @RequirePermissions('inventory.adjust')
  @ApiOperation({
    summary: 'Transition stock transfer status',
    description:
      'draft→in_transit (lines required, applyMovement out); in_transit→completed (in); cancel returns stock if in_transit.',
  })
  @ApiOkResponse({ type: StockTransferResponseDto })
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionStockTransferDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<StockTransferResponseDto> {
    return this.stockTransfersService.transition(
      id,
      dto,
      organizationId,
      user,
    );
  }
}
