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
import { CreateLandedCostDto } from './dto/create-landed-cost.dto';
import {
  CreateLandedCostItemDto,
  LandedCostItemResponseDto,
  UpdateLandedCostItemDto,
} from './dto/landed-cost-item.dto';
import { LandedCostResponseDto } from './dto/landed-cost-response.dto';
import { ListLandedCostsQueryDto } from './dto/list-landed-costs-query.dto';
import { UpdateLandedCostDto } from './dto/update-landed-cost.dto';
import { LandedCostsService } from './landed-costs.service';

@ApiTags(SWAGGER_TAG.CoutRendu)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('landed-costs')
export class LandedCostsController {
  constructor(private readonly landedCostsService: LandedCostsService) {}

  @Get()
  @RequirePermissions('landed_costs.read')
  @ApiOperation({
    summary: 'List landed costs',
    description:
      'Search reference; filter status, purchase order, shipment, currency.',
  })
  @ApiPaginatedResponse(LandedCostResponseDto)
  findAll(
    @Query() query: ListLandedCostsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<LandedCostResponseDto>> {
    return this.landedCostsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('landed_costs.read')
  @ApiOperation({ summary: 'Get a landed cost with its line items' })
  @ApiOkResponse({ type: LandedCostResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<LandedCostResponseDto> {
    return this.landedCostsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('landed_costs.write')
  @ApiOperation({
    summary: 'Create a landed cost',
    description:
      'Starts in draft. Requires purchaseOrderId and/or shipmentId. Optional nested items; goodsCost summed server-side.',
  })
  @ApiCreatedResponse({ type: LandedCostResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateLandedCostDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<LandedCostResponseDto> {
    return this.landedCostsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('landed_costs.write')
  @ApiOperation({
    summary: 'Update a landed cost header',
    description:
      'Not allowed when posted. Structural edits reset status to draft and clear item allocations.',
  })
  @ApiOkResponse({ type: LandedCostResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLandedCostDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<LandedCostResponseDto> {
    return this.landedCostsService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('landed_costs.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete a landed cost',
    description: 'Not allowed when posted.',
  })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.landedCostsService.remove(id, organizationId, user);
  }

  @Get(':id/items')
  @RequirePermissions('landed_costs.read')
  @ApiOperation({ summary: 'List landed cost line items' })
  @ApiOkResponse({ type: [LandedCostItemResponseDto] })
  listItems(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<LandedCostItemResponseDto[]> {
    return this.landedCostsService.listItems(id, organizationId, user);
  }

  @Post(':id/items')
  @RequirePermissions('landed_costs.write')
  @ApiOperation({
    summary: 'Add a line item',
    description:
      'Not allowed when posted. Resets status to draft and clears allocations.',
  })
  @ApiCreatedResponse({ type: LandedCostItemResponseDto })
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateLandedCostItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<LandedCostItemResponseDto> {
    return this.landedCostsService.addItem(id, dto, organizationId, user);
  }

  @Patch(':id/items/:itemId')
  @RequirePermissions('landed_costs.write')
  @ApiOperation({
    summary: 'Update a line item',
    description: 'Not allowed when posted. Resets status to draft.',
  })
  @ApiOkResponse({ type: LandedCostItemResponseDto })
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateLandedCostItemDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<LandedCostItemResponseDto> {
    return this.landedCostsService.updateItem(
      id,
      itemId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions('landed_costs.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Hard-delete a line item',
    description: 'Not allowed when posted.',
  })
  @ApiNoContentResponse()
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.landedCostsService.removeItem(
      id,
      itemId,
      organizationId,
      user,
    );
  }
}
