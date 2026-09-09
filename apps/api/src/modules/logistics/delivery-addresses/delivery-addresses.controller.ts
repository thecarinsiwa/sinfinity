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
import { DeliveryAddressesService } from './delivery-addresses.service';
import {
  CreateDeliveryAddressDto,
  DeliveryAddressResponseDto,
  ListDeliveryAddressesQueryDto,
  UpdateDeliveryAddressDto,
} from './dto/delivery-address.dto';

@ApiTags(SWAGGER_TAG.Logistique)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('delivery-addresses')
export class DeliveryAddressesController {
  constructor(
    private readonly deliveryAddressesService: DeliveryAddressesService,
  ) {}

  @Get()
  @RequirePermissions('shipments.read')
  @ApiOperation({
    summary: 'List ad-hoc delivery addresses',
    description:
      'Search label/line1/contact; filter customerId or warehouseId. Soft-deleted excluded.',
  })
  @ApiPaginatedResponse(DeliveryAddressResponseDto)
  findAll(
    @Query() query: ListDeliveryAddressesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<DeliveryAddressResponseDto>> {
    return this.deliveryAddressesService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('shipments.read')
  @ApiOperation({ summary: 'Get a delivery address' })
  @ApiOkResponse({ type: DeliveryAddressResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DeliveryAddressResponseDto> {
    return this.deliveryAddressesService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('shipments.write')
  @ApiOperation({
    summary: 'Create an ad-hoc delivery address',
    description:
      'Requires at least one of customerId or warehouseId (chantier / campus / warehouse site).',
  })
  @ApiCreatedResponse({ type: DeliveryAddressResponseDto })
  create(
    @Body() dto: CreateDeliveryAddressDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DeliveryAddressResponseDto> {
    return this.deliveryAddressesService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('shipments.write')
  @ApiOperation({ summary: 'Update a delivery address' })
  @ApiOkResponse({ type: DeliveryAddressResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeliveryAddressDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<DeliveryAddressResponseDto> {
    return this.deliveryAddressesService.update(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id')
  @RequirePermissions('shipments.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a delivery address' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.deliveryAddressesService.remove(id, organizationId, user);
  }
}
