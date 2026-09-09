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
import { CarriersService } from './carriers.service';
import {
  CarrierResponseDto,
  CreateCarrierDto,
  ListCarriersQueryDto,
  UpdateCarrierDto,
} from './dto/carrier.dto';

@ApiTags(SWAGGER_TAG.Logistique)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('carriers')
export class CarriersController {
  constructor(private readonly carriersService: CarriersService) {}

  @Get()
  @RequirePermissions('shipments.read')
  @ApiOperation({
    summary: 'List carriers',
    description: 'Search name/code; filter isActive. Soft-deleted excluded.',
  })
  @ApiPaginatedResponse(CarrierResponseDto)
  findAll(
    @Query() query: ListCarriersQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<CarrierResponseDto>> {
    return this.carriersService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('shipments.read')
  @ApiOperation({ summary: 'Get a carrier by id' })
  @ApiOkResponse({ type: CarrierResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CarrierResponseDto> {
    return this.carriersService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('shipments.write')
  @ApiOperation({
    summary: 'Create a carrier',
    description: 'Includes optional trackingUrlTemplate for tracking deep-links.',
  })
  @ApiCreatedResponse({ type: CarrierResponseDto })
  create(
    @Body() dto: CreateCarrierDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CarrierResponseDto> {
    return this.carriersService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('shipments.write')
  @ApiOperation({ summary: 'Update a carrier' })
  @ApiOkResponse({ type: CarrierResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCarrierDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CarrierResponseDto> {
    return this.carriersService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('shipments.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a carrier' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.carriersService.remove(id, organizationId, user);
  }
}
