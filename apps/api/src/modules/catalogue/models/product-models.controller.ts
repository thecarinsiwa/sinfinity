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
import { CreateProductModelDto } from './dto/create-product-model.dto';
import { ListProductModelsQueryDto } from './dto/list-product-models-query.dto';
import { ProductModelResponseDto } from './dto/product-model-response.dto';
import { UpdateProductModelDto } from './dto/update-product-model.dto';
import { ProductModelsService } from './product-models.service';

@ApiTags(SWAGGER_TAG.Catalogue)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('product-models')
export class ProductModelsController {
  constructor(private readonly productModelsService: ProductModelsService) {}

  @Get()
  @RequirePermissions('catalog.read')
  @ApiOperation({ summary: 'List product models' })
  @ApiPaginatedResponse(ProductModelResponseDto)
  findAll(
    @Query() query: ListProductModelsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<ProductModelResponseDto>> {
    return this.productModelsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('catalog.read')
  @ApiOperation({ summary: 'Get a product model by id' })
  @ApiOkResponse({ type: ProductModelResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductModelResponseDto> {
    return this.productModelsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('catalog.write')
  @ApiOperation({ summary: 'Create a product model' })
  @ApiCreatedResponse({ type: ProductModelResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateProductModelDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductModelResponseDto> {
    return this.productModelsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('catalog.write')
  @ApiOperation({ summary: 'Update a product model' })
  @ApiOkResponse({ type: ProductModelResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductModelDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProductModelResponseDto> {
    return this.productModelsService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('catalog.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a product model' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.productModelsService.remove(id, organizationId, user);
  }
}
