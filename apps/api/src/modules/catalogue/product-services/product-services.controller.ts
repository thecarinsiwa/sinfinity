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
  CurrentUser,
  ErrorResponseDto,
  JwtAuthGuard,
  OrganizationId,
  ParseUUIDPipe,
  PermissionsGuard,
  RequirePermissions,
  type AuthUser,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import {
  CreateProductServiceLinkDto,
  ProductServiceLinkResponseDto,
  UpdateProductServiceLinkDto,
} from './dto/product-service-link.dto';
import { ProductServicesService } from './product-services.service';

@ApiTags(SWAGGER_TAG.Catalogue)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('products/:productId/services')
export class ProductServicesController {
  constructor(
    private readonly productServicesService: ProductServicesService,
  ) {}

  @Get()
  @RequirePermissions('catalog.read')
  @ApiOperation({ summary: 'List services linked to a product' })
  @ApiOkResponse({ type: [ProductServiceLinkResponseDto] })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  list(
    @Param('productId', ParseUUIDPipe) productId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductServiceLinkResponseDto[]> {
    return this.productServicesService.listByProduct(
      productId,
      organizationId,
      user,
    );
  }

  @Post()
  @RequirePermissions('catalog.write')
  @ApiOperation({
    summary: 'Link a service to a product',
    description: 'Unique per (productId, serviceId). Same organization required.',
  })
  @ApiCreatedResponse({ type: ProductServiceLinkResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateProductServiceLinkDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductServiceLinkResponseDto> {
    return this.productServicesService.create(
      productId,
      dto,
      organizationId,
      user,
    );
  }

  @Patch(':linkId')
  @RequirePermissions('catalog.write')
  @ApiOperation({ summary: 'Update a product–service link' })
  @ApiOkResponse({ type: ProductServiceLinkResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  update(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @Body() dto: UpdateProductServiceLinkDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductServiceLinkResponseDto> {
    return this.productServicesService.update(
      productId,
      linkId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':linkId')
  @RequirePermissions('catalog.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlink a service from a product' })
  @ApiNoContentResponse()
  remove(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.productServicesService.remove(
      productId,
      linkId,
      organizationId,
      user,
    );
  }
}
