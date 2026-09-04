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
import { CreateProductSubcategoryDto } from './dto/create-product-subcategory.dto';
import { ListProductSubcategoriesQueryDto } from './dto/list-product-subcategories-query.dto';
import { ProductSubcategoryResponseDto } from './dto/product-subcategory-response.dto';
import { UpdateProductSubcategoryDto } from './dto/update-product-subcategory.dto';
import { ProductSubcategoriesService } from './product-subcategories.service';

@ApiTags(SWAGGER_TAG.Catalogue)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('product-subcategories')
export class ProductSubcategoriesController {
  constructor(
    private readonly productSubcategoriesService: ProductSubcategoriesService,
  ) {}

  @Get()
  @RequirePermissions('catalog.read')
  @ApiOperation({ summary: 'List product subcategories' })
  @ApiPaginatedResponse(ProductSubcategoryResponseDto)
  findAll(
    @Query() query: ListProductSubcategoriesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<ProductSubcategoryResponseDto>> {
    return this.productSubcategoriesService.findAll(
      query,
      organizationId,
      user,
    );
  }

  @Get(':id')
  @RequirePermissions('catalog.read')
  @ApiOperation({ summary: 'Get a product subcategory by id' })
  @ApiOkResponse({ type: ProductSubcategoryResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductSubcategoryResponseDto> {
    return this.productSubcategoriesService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('catalog.write')
  @ApiOperation({ summary: 'Create a product subcategory' })
  @ApiCreatedResponse({ type: ProductSubcategoryResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateProductSubcategoryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductSubcategoryResponseDto> {
    return this.productSubcategoriesService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('catalog.write')
  @ApiOperation({ summary: 'Update a product subcategory' })
  @ApiOkResponse({ type: ProductSubcategoryResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductSubcategoryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductSubcategoryResponseDto> {
    return this.productSubcategoriesService.update(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id')
  @RequirePermissions('catalog.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a product subcategory' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.productSubcategoriesService.remove(id, organizationId, user);
  }
}
