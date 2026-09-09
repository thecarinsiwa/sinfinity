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
  CreateInventoryBatchDto,
  InventoryBatchResponseDto,
  ListInventoryBatchesQueryDto,
  UpdateInventoryBatchDto,
} from './dto/inventory-batch.dto';
import { InventoryBatchesService } from './inventory-batches.service';

@ApiTags(SWAGGER_TAG.Stock)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory-batches')
export class InventoryBatchesController {
  constructor(
    private readonly inventoryBatchesService: InventoryBatchesService,
  ) {}

  @Get()
  @RequirePermissions('inventory.read')
  @ApiOperation({
    summary: 'List inventory batches',
    description: 'Lots by product; unique batchNumber per org+product.',
  })
  @ApiPaginatedResponse(InventoryBatchResponseDto)
  findAll(
    @Query() query: ListInventoryBatchesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<InventoryBatchResponseDto>> {
    return this.inventoryBatchesService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('inventory.read')
  @ApiOperation({ summary: 'Get an inventory batch by id' })
  @ApiOkResponse({ type: InventoryBatchResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InventoryBatchResponseDto> {
    return this.inventoryBatchesService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('inventory.adjust')
  @ApiOperation({ summary: 'Create an inventory batch' })
  @ApiCreatedResponse({ type: InventoryBatchResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateInventoryBatchDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InventoryBatchResponseDto> {
    return this.inventoryBatchesService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('inventory.adjust')
  @ApiOperation({ summary: 'Update an inventory batch' })
  @ApiOkResponse({ type: InventoryBatchResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryBatchDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InventoryBatchResponseDto> {
    return this.inventoryBatchesService.update(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id')
  @RequirePermissions('inventory.adjust')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Hard-delete an inventory batch',
    description: 'Fails if referenced by inventory or serial numbers.',
  })
  @ApiNoContentResponse()
  @ApiConflictResponse({ type: ErrorResponseDto })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.inventoryBatchesService.remove(id, organizationId, user);
  }
}
