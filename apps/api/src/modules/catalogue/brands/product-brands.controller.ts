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
import { CreateProductBrandDto } from './dto/create-product-brand.dto';
import { ListProductBrandsQueryDto } from './dto/list-product-brands-query.dto';
import { ProductBrandResponseDto } from './dto/product-brand-response.dto';
import { UpdateProductBrandDto } from './dto/update-product-brand.dto';
import { ProductBrandsService } from './product-brands.service';

@ApiTags(SWAGGER_TAG.Catalogue)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('product-brands')
export class ProductBrandsController {
  constructor(private readonly productBrandsService: ProductBrandsService) {}

  @Get()
  @RequirePermissions('catalog.read')
  @ApiOperation({ summary: 'List product brands' })
  @ApiPaginatedResponse(ProductBrandResponseDto)
  findAll(
    @Query() query: ListProductBrandsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<ProductBrandResponseDto>> {
    return this.productBrandsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('catalog.read')
  @ApiOperation({ summary: 'Get a product brand by id' })
  @ApiOkResponse({ type: ProductBrandResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductBrandResponseDto> {
    return this.productBrandsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('catalog.write')
  @ApiOperation({ summary: 'Create a product brand' })
  @ApiCreatedResponse({ type: ProductBrandResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateProductBrandDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductBrandResponseDto> {
    return this.productBrandsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('catalog.write')
  @ApiOperation({ summary: 'Update a product brand' })
  @ApiOkResponse({ type: ProductBrandResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductBrandDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductBrandResponseDto> {
    return this.productBrandsService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('catalog.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a product brand' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.productBrandsService.remove(id, organizationId, user);
  }
}
