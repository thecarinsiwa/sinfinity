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
  ErrorResponseDto,
  JwtAuthGuard,
  OrganizationId,
  ParseUUIDPipe,
  PermissionsGuard,
  RequirePermissions,
  type PaginatedResponseDto,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { CreateTaxDto } from './dto/create-tax.dto';
import { ListTaxesQueryDto } from './dto/list-taxes-query.dto';
import { TaxResponseDto } from './dto/tax-response.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { TaxesService } from './taxes.service';

@ApiTags('Settings')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('taxes')
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Get()
  @RequirePermissions('settings.read')
  @ApiOperation({
    summary: 'List taxes',
    description:
      'Returns global taxes plus those scoped to the current organization (when known). Soft-deleted rows are excluded.',
  })
  @ApiPaginatedResponse(TaxResponseDto)
  findAll(
    @Query() query: ListTaxesQueryDto,
    @OrganizationId() organizationId?: string,
  ): Promise<PaginatedResponseDto<TaxResponseDto>> {
    return this.taxesService.findAll(query, organizationId);
  }

  @Get(':id')
  @RequirePermissions('settings.read')
  @ApiOperation({ summary: 'Get a tax by id' })
  @ApiOkResponse({ type: TaxResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TaxResponseDto> {
    return this.taxesService.findOne(id);
  }

  @Post()
  @RequirePermissions('settings.write')
  @ApiOperation({ summary: 'Create a tax' })
  @ApiCreatedResponse({ type: TaxResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateTaxDto,
    @OrganizationId() organizationId?: string,
  ): Promise<TaxResponseDto> {
    return this.taxesService.create(dto, organizationId);
  }

  @Patch(':id')
  @RequirePermissions('settings.write')
  @ApiOperation({ summary: 'Update a tax' })
  @ApiOkResponse({ type: TaxResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaxDto,
  ): Promise<TaxResponseDto> {
    return this.taxesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('settings.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete a tax',
    description: 'Sets deleted_at; row is excluded from subsequent lists.',
  })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.taxesService.remove(id);
  }
}
