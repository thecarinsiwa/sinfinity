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
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import {
  CreateProductImageDto,
  CreateProductSpecificationDto,
  ProductImageResponseDto,
  ProductSpecificationResponseDto,
  UpdateProductImageDto,
  UpdateProductSpecificationDto,
} from './dto/product-nested.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags(SWAGGER_TAG.Catalogue)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermissions('catalog.read')
  @ApiOperation({
    summary: 'List products',
    description: 'Search sku/name; filter category, brand, subcategory. No stock.',
  })
  @ApiPaginatedResponse(ProductResponseDto)
  findAll(
    @Query() query: ListProductsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    return this.productsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('catalog.read')
  @ApiOperation({ summary: 'Get a product with specifications and images' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductResponseDto> {
    return this.productsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('catalog.write')
  @ApiOperation({
    summary: 'Create a product',
    description: 'SKU unique per organization. Optional nested specs/images.',
  })
  @ApiCreatedResponse({ type: ProductResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateProductDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductResponseDto> {
    return this.productsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('catalog.write')
  @ApiOperation({ summary: 'Update a product' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('catalog.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a product' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.productsService.remove(id, organizationId, user);
  }

  @Get(':id/specifications')
  @RequirePermissions('catalog.read')
  @ApiOperation({ summary: 'List product specifications' })
  @ApiOkResponse({ type: [ProductSpecificationResponseDto] })
  listSpecifications(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductSpecificationResponseDto[]> {
    return this.productsService.listSpecifications(id, organizationId, user);
  }

  @Post(':id/specifications')
  @RequirePermissions('catalog.write')
  @ApiOperation({ summary: 'Add a product specification' })
  @ApiCreatedResponse({ type: ProductSpecificationResponseDto })
  addSpecification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProductSpecificationDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductSpecificationResponseDto> {
    return this.productsService.addSpecification(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Patch(':id/specifications/:specId')
  @RequirePermissions('catalog.write')
  @ApiOperation({ summary: 'Update a product specification' })
  @ApiOkResponse({ type: ProductSpecificationResponseDto })
  updateSpecification(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('specId', ParseUUIDPipe) specId: string,
    @Body() dto: UpdateProductSpecificationDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductSpecificationResponseDto> {
    return this.productsService.updateSpecification(
      id,
      specId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/specifications/:specId')
  @RequirePermissions('catalog.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product specification' })
  @ApiNoContentResponse()
  removeSpecification(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('specId', ParseUUIDPipe) specId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.productsService.removeSpecification(
      id,
      specId,
      organizationId,
      user,
    );
  }

  @Get(':id/images')
  @RequirePermissions('catalog.read')
  @ApiOperation({ summary: 'List product images' })
  @ApiOkResponse({ type: [ProductImageResponseDto] })
  listImages(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductImageResponseDto[]> {
    return this.productsService.listImages(id, organizationId, user);
  }

  @Post(':id/images')
  @RequirePermissions('catalog.write')
  @ApiOperation({
    summary: 'Add a product image',
    description: 'Setting isPrimary=true clears other primaries on the product.',
  })
  @ApiCreatedResponse({ type: ProductImageResponseDto })
  addImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProductImageDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductImageResponseDto> {
    return this.productsService.addImage(id, dto, organizationId, user);
  }

  @Patch(':id/images/:imageId')
  @RequirePermissions('catalog.write')
  @ApiOperation({ summary: 'Update a product image' })
  @ApiOkResponse({ type: ProductImageResponseDto })
  updateImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @Body() dto: UpdateProductImageDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductImageResponseDto> {
    return this.productsService.updateImage(
      id,
      imageId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/images/:imageId')
  @RequirePermissions('catalog.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product image' })
  @ApiNoContentResponse()
  removeImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.productsService.removeImage(
      id,
      imageId,
      organizationId,
      user,
    );
  }
}
