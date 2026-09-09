import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
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
  InventoryMovementResponseDto,
  InventoryResponseDto,
  ListInventoryMovementsQueryDto,
  ListInventoryQueryDto,
} from './dto/inventory.dto';
import { InventoryMovementsService } from './inventory-movements.service';

@ApiTags(SWAGGER_TAG.Stock)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class InventoryController {
  constructor(
    private readonly inventoryMovementsService: InventoryMovementsService,
  ) {}

  @Get('inventory')
  @RequirePermissions('inventory.read')
  @ApiOperation({
    summary: 'List inventory balances',
    description:
      'Filter by product, warehouse, location, batch. Quantities only change via applyMovement.',
  })
  @ApiPaginatedResponse(InventoryResponseDto)
  findInventory(
    @Query() query: ListInventoryQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<InventoryResponseDto>> {
    return this.inventoryMovementsService.findInventory(
      query,
      organizationId,
      user,
    );
  }

  @Get('inventory/:id')
  @RequirePermissions('inventory.read')
  @ApiOperation({ summary: 'Get an inventory balance by id' })
  @ApiOkResponse({ type: InventoryResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findInventoryOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InventoryResponseDto> {
    return this.inventoryMovementsService.findInventoryOne(
      id,
      organizationId,
      user,
    );
  }

  @Get('inventory-movements')
  @RequirePermissions('inventory.read')
  @ApiOperation({
    summary: 'List inventory movements',
    description: 'Audit trail of stock changes (in/out/reserve/adjustment…).',
  })
  @ApiPaginatedResponse(InventoryMovementResponseDto)
  findMovements(
    @Query() query: ListInventoryMovementsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<InventoryMovementResponseDto>> {
    return this.inventoryMovementsService.findMovements(
      query,
      organizationId,
      user,
    );
  }
}
