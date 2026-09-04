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
import { CreateSupplierCategoryDto } from './dto/create-supplier-category.dto';
import { ListSupplierCategoriesQueryDto } from './dto/list-supplier-categories-query.dto';
import { SupplierCategoryResponseDto } from './dto/supplier-category-response.dto';
import { UpdateSupplierCategoryDto } from './dto/update-supplier-category.dto';
import { SupplierCategoriesService } from './supplier-categories.service';

@ApiTags(SWAGGER_TAG.Fournisseurs)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('supplier-categories')
export class SupplierCategoriesController {
  constructor(
    private readonly supplierCategoriesService: SupplierCategoriesService,
  ) {}

  @Get()
  @RequirePermissions('suppliers.read')
  @ApiOperation({ summary: 'List supplier categories' })
  @ApiPaginatedResponse(SupplierCategoryResponseDto)
  findAll(
    @Query() query: ListSupplierCategoriesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<SupplierCategoryResponseDto>> {
    return this.supplierCategoriesService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('suppliers.read')
  @ApiOperation({ summary: 'Get a supplier category by id' })
  @ApiOkResponse({ type: SupplierCategoryResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierCategoryResponseDto> {
    return this.supplierCategoriesService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('suppliers.write')
  @ApiOperation({ summary: 'Create a supplier category' })
  @ApiCreatedResponse({ type: SupplierCategoryResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateSupplierCategoryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierCategoryResponseDto> {
    return this.supplierCategoriesService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('suppliers.write')
  @ApiOperation({ summary: 'Update a supplier category' })
  @ApiOkResponse({ type: SupplierCategoryResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierCategoryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierCategoryResponseDto> {
    return this.supplierCategoriesService.update(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id')
  @RequirePermissions('suppliers.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a supplier category' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.supplierCategoriesService.remove(id, organizationId, user);
  }
}
