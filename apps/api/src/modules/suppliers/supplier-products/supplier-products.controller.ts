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
import { CreateSupplierProductDto } from './dto/create-supplier-product.dto';
import { ListSupplierProductsQueryDto } from './dto/list-supplier-products-query.dto';
import { SupplierProductResponseDto } from './dto/supplier-product-response.dto';
import { UpdateSupplierProductDto } from './dto/update-supplier-product.dto';
import { SupplierProductsService } from './supplier-products.service';

@ApiTags(SWAGGER_TAG.Fournisseurs)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('supplier-products')
export class SupplierProductsController {
  constructor(
    private readonly supplierProductsService: SupplierProductsService,
  ) {}

  @Get()
  @RequirePermissions('suppliers.read')
  @ApiOperation({
    summary: 'List supplier products',
    description:
      'Filter by supplierId or productId (who sells this product). Search supplierSku.',
  })
  @ApiPaginatedResponse(SupplierProductResponseDto)
  findAll(
    @Query() query: ListSupplierProductsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<SupplierProductResponseDto>> {
    return this.supplierProductsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('suppliers.read')
  @ApiOperation({ summary: 'Get a supplier product link by id' })
  @ApiOkResponse({ type: SupplierProductResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierProductResponseDto> {
    return this.supplierProductsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('suppliers.write')
  @ApiOperation({
    summary: 'Link a product to a supplier',
    description: 'Unique (supplierId, productId) per catalog row.',
  })
  @ApiCreatedResponse({ type: SupplierProductResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateSupplierProductDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierProductResponseDto> {
    return this.supplierProductsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('suppliers.write')
  @ApiOperation({ summary: 'Update a supplier product link' })
  @ApiOkResponse({ type: SupplierProductResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierProductDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierProductResponseDto> {
    return this.supplierProductsService.update(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id')
  @RequirePermissions('suppliers.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a supplier product link' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.supplierProductsService.remove(id, organizationId, user);
  }
}
