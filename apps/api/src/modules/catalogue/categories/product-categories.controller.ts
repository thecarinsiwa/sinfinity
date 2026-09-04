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
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { ListProductCategoriesQueryDto } from './dto/list-product-categories-query.dto';
import {
  ProductCategoryResponseDto,
  ProductCategoryTreeNodeDto,
} from './dto/product-category-response.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategoriesService } from './product-categories.service';

@ApiTags(SWAGGER_TAG.Catalogue)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('product-categories')
export class ProductCategoriesController {
  constructor(
    private readonly productCategoriesService: ProductCategoriesService,
  ) {}

  @Get()
  @RequirePermissions('catalog.read')
  @ApiOperation({ summary: 'List product categories (flat, paginated)' })
  @ApiPaginatedResponse(ProductCategoryResponseDto)
  findAll(
    @Query() query: ListProductCategoriesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<ProductCategoryResponseDto>> {
    return this.productCategoriesService.findAll(query, organizationId, user);
  }

  @Get('tree')
  @RequirePermissions('catalog.read')
  @ApiOperation({
    summary: 'Product category tree for UI',
    description: 'Roots have null parentId; children nested by sortOrder then code.',
  })
  @ApiOkResponse({ type: [ProductCategoryTreeNodeDto] })
  findTree(
    @Query('organizationId') organizationIdQuery: string | undefined,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductCategoryTreeNodeDto[]> {
    return this.productCategoriesService.findTree(
      organizationIdQuery,
      organizationId,
      user,
    );
  }

  @Get(':id')
  @RequirePermissions('catalog.read')
  @ApiOperation({ summary: 'Get a product category by id' })
  @ApiOkResponse({ type: ProductCategoryResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductCategoryResponseDto> {
    return this.productCategoriesService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('catalog.write')
  @ApiOperation({ summary: 'Create a product category' })
  @ApiCreatedResponse({ type: ProductCategoryResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateProductCategoryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductCategoryResponseDto> {
    return this.productCategoriesService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('catalog.write')
  @ApiOperation({ summary: 'Update a product category' })
  @ApiOkResponse({ type: ProductCategoryResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductCategoryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductCategoryResponseDto> {
    return this.productCategoriesService.update(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id')
  @RequirePermissions('catalog.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a product category' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.productCategoriesService.remove(id, organizationId, user);
  }
}
