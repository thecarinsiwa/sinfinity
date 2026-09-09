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
  CreateStockReservationDto,
  ListStockReservationsQueryDto,
  StockReservationResponseDto,
} from './dto/stock-reservation.dto';
import { StockReservationsService } from './stock-reservations.service';

@ApiTags(SWAGGER_TAG.Stock)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('stock-reservations')
export class StockReservationsController {
  constructor(
    private readonly stockReservationsService: StockReservationsService,
  ) {}

  @Get()
  @RequirePermissions('inventory.read')
  @ApiOperation({
    summary: 'List stock reservations',
    description: 'Scoped via inventory.organization_id.',
  })
  @ApiPaginatedResponse(StockReservationResponseDto)
  findAll(
    @Query() query: ListStockReservationsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<StockReservationResponseDto>> {
    return this.stockReservationsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('inventory.read')
  @ApiOperation({ summary: 'Get a stock reservation by id' })
  @ApiOkResponse({ type: StockReservationResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<StockReservationResponseDto> {
    return this.stockReservationsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('inventory.adjust')
  @ApiOperation({
    summary: 'Create a stock reservation',
    description:
      'Links inventory + sales order item; applyMovement(reserve); status active.',
  })
  @ApiCreatedResponse({ type: StockReservationResponseDto })
  create(
    @Body() dto: CreateStockReservationDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<StockReservationResponseDto> {
    return this.stockReservationsService.create(dto, organizationId, user);
  }

  @Post(':id/release')
  @RequirePermissions('inventory.adjust')
  @ApiOperation({
    summary: 'Release an active reservation',
    description: 'applyMovement(unreserve) → status released.',
  })
  @ApiOkResponse({ type: StockReservationResponseDto })
  release(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<StockReservationResponseDto> {
    return this.stockReservationsService.release(id, organizationId, user);
  }

  @Post(':id/fulfill')
  @RequirePermissions('inventory.adjust')
  @ApiOperation({
    summary: 'Fulfill an active reservation',
    description:
      'unreserve then out (same qty) so reserved stock is consumed; status fulfilled.',
  })
  @ApiOkResponse({ type: StockReservationResponseDto })
  fulfill(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<StockReservationResponseDto> {
    return this.stockReservationsService.fulfill(id, organizationId, user);
  }
}
