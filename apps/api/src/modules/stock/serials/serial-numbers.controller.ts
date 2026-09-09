import {
  Body,
  Controller,
  Get,
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
import {
  CreateSerialNumberDto,
  ListSerialNumbersQueryDto,
  SerialNumberResponseDto,
  TransitionSerialNumberDto,
  UpdateSerialNumberDto,
} from './dto/serial-number.dto';
import { SerialNumbersService } from './serial-numbers.service';

@ApiTags(SWAGGER_TAG.Stock)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('serial-numbers')
export class SerialNumbersController {
  constructor(private readonly serialNumbersService: SerialNumbersService) {}

  @Get()
  @RequirePermissions('inventory.read')
  @ApiOperation({
    summary: 'List serial numbers',
    description: 'Unique per organization; filter product/warehouse/status.',
  })
  @ApiPaginatedResponse(SerialNumberResponseDto)
  findAll(
    @Query() query: ListSerialNumbersQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<SerialNumberResponseDto>> {
    return this.serialNumbersService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('inventory.read')
  @ApiOperation({ summary: 'Get a serial number by id' })
  @ApiOkResponse({ type: SerialNumberResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SerialNumberResponseDto> {
    return this.serialNumbersService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('inventory.adjust')
  @ApiOperation({ summary: 'Create a serial number' })
  @ApiCreatedResponse({ type: SerialNumberResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateSerialNumberDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SerialNumberResponseDto> {
    return this.serialNumbersService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('inventory.adjust')
  @ApiOperation({
    summary: 'Update serial number metadata',
    description: 'Status changes go through POST :id/transition.',
  })
  @ApiOkResponse({ type: SerialNumberResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSerialNumberDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SerialNumberResponseDto> {
    return this.serialNumbersService.update(id, dto, organizationId, user);
  }

  @Post(':id/transition')
  @RequirePermissions('inventory.adjust')
  @ApiOperation({
    summary: 'Transition serial number status',
    description:
      'in_stock → reserved → shipped → installed (+ returned/scrapped).',
  })
  @ApiOkResponse({ type: SerialNumberResponseDto })
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionSerialNumberDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SerialNumberResponseDto> {
    return this.serialNumbersService.transition(
      id,
      dto,
      organizationId,
      user,
    );
  }
}
