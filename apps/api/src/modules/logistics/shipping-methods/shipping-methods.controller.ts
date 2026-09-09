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
  ErrorResponseDto,
  JwtAuthGuard,
  ParseUUIDPipe,
  PermissionsGuard,
  RequirePermissions,
  type PaginatedResponseDto,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import { ListShippingMethodsQueryDto } from './dto/list-shipping-methods-query.dto';
import {
  CreateShippingMethodDto,
  ShippingMethodResponseDto,
  UpdateShippingMethodDto,
} from './dto/shipping-method.dto';
import { ShippingMethodsService } from './shipping-methods.service';

@ApiTags(SWAGGER_TAG.Logistique)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('shipping-methods')
export class ShippingMethodsController {
  constructor(private readonly shippingMethodsService: ShippingMethodsService) {}

  @Get()
  @RequirePermissions('shipments.read')
  @ApiOperation({
    summary: 'List shipping methods',
    description:
      'Ensures SEA/AIR/ROAD/RAIL are seeded. Suitable for UI selects.',
  })
  @ApiPaginatedResponse(ShippingMethodResponseDto)
  findAll(
    @Query() query: ListShippingMethodsQueryDto,
  ): Promise<PaginatedResponseDto<ShippingMethodResponseDto>> {
    return this.shippingMethodsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('shipments.read')
  @ApiOperation({ summary: 'Get a shipping method by id' })
  @ApiOkResponse({ type: ShippingMethodResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ShippingMethodResponseDto> {
    return this.shippingMethodsService.findOne(id);
  }

  @Post()
  @RequirePermissions('shipments.write')
  @ApiOperation({ summary: 'Create a shipping method' })
  @ApiCreatedResponse({ type: ShippingMethodResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateShippingMethodDto,
  ): Promise<ShippingMethodResponseDto> {
    return this.shippingMethodsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('shipments.write')
  @ApiOperation({ summary: 'Update a shipping method' })
  @ApiOkResponse({ type: ShippingMethodResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShippingMethodDto,
  ): Promise<ShippingMethodResponseDto> {
    return this.shippingMethodsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('shipments.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a shipping method' })
  @ApiNoContentResponse()
  @ApiConflictResponse({ type: ErrorResponseDto })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.shippingMethodsService.remove(id);
  }
}
