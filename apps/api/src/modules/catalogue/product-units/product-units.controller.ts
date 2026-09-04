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
  ErrorResponseDto,
  JwtAuthGuard,
  ParseUUIDPipe,
  PermissionsGuard,
  RequirePermissions,
  type PaginatedResponseDto,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import { ListProductUnitsQueryDto } from './dto/list-product-units-query.dto';
import { ProductUnitResponseDto } from './dto/product-unit-response.dto';
import { ProductUnitsService } from './product-units.service';

@ApiTags(SWAGGER_TAG.Catalogue)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('product-units')
export class ProductUnitsController {
  constructor(private readonly productUnitsService: ProductUnitsService) {}

  @Get()
  @RequirePermissions('catalog.read')
  @ApiOperation({
    summary: 'List product units (global reference)',
    description: 'Read-only. Used as unit_id on products.',
  })
  @ApiPaginatedResponse(ProductUnitResponseDto)
  findAll(
    @Query() query: ListProductUnitsQueryDto,
  ): Promise<PaginatedResponseDto<ProductUnitResponseDto>> {
    return this.productUnitsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('catalog.read')
  @ApiOperation({ summary: 'Get a product unit by id' })
  @ApiOkResponse({ type: ProductUnitResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductUnitResponseDto> {
    return this.productUnitsService.findOne(id);
  }
}
