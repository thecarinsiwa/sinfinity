import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  CurrentUser,
  JwtAuthGuard,
  OrganizationId,
  PermissionsGuard,
  RequirePermissions,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import {
  CreateSupplierHistoryDto,
  ListSupplierHistoriesQueryDto,
  SupplierHistoryResponseDto,
} from './dto/supplier-history.dto';
import { SupplierHistoriesService } from './supplier-histories.service';

@ApiTags(SWAGGER_TAG.Fournisseurs)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('supplier-histories')
export class SupplierHistoriesController {
  constructor(
    private readonly supplierHistoriesService: SupplierHistoriesService,
  ) {}

  @Get()
  @RequirePermissions('suppliers.read')
  @ApiOperation({
    summary: 'List supplier history events',
    description: 'Append-only timeline. Filter by supplierId, eventType, date range.',
  })
  @ApiPaginatedResponse(SupplierHistoryResponseDto)
  findAll(
    @Query() query: ListSupplierHistoriesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<SupplierHistoryResponseDto>> {
    return this.supplierHistoriesService.findAll(
      query,
      organizationId,
      user,
    );
  }

  @Post()
  @RequirePermissions('suppliers.write')
  @ApiOperation({
    summary: 'Append a supplier history event',
    description:
      'eventType allowlist: quote | po | payment | evaluation. No PATCH/DELETE.',
  })
  @ApiCreatedResponse({ type: SupplierHistoryResponseDto })
  create(
    @Body() dto: CreateSupplierHistoryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierHistoryResponseDto> {
    return this.supplierHistoriesService.create(dto, organizationId, user);
  }
}
