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
import { CreateShippingTermDto } from './dto/create-shipping-term.dto';
import { ListShippingTermsQueryDto } from './dto/list-shipping-terms-query.dto';
import { ShippingTermResponseDto } from './dto/shipping-term-response.dto';
import { UpdateShippingTermDto } from './dto/update-shipping-term.dto';
import { ShippingTermsService } from './shipping-terms.service';

@ApiTags('Settings')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('shipping-terms')
export class ShippingTermsController {
  constructor(private readonly shippingTermsService: ShippingTermsService) {}

  @Get()
  @RequirePermissions('settings.read')
  @ApiOperation({
    summary: 'List shipping terms (Incoterms)',
    description: 'Suitable for UI select lists (EXW, FOB, CIF, DDU, DDP…).',
  })
  @ApiPaginatedResponse(ShippingTermResponseDto)
  findAll(
    @Query() query: ListShippingTermsQueryDto,
  ): Promise<PaginatedResponseDto<ShippingTermResponseDto>> {
    return this.shippingTermsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('settings.read')
  @ApiOperation({ summary: 'Get a shipping term by id' })
  @ApiOkResponse({ type: ShippingTermResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ShippingTermResponseDto> {
    return this.shippingTermsService.findOne(id);
  }

  @Post()
  @RequirePermissions('settings.write')
  @ApiOperation({ summary: 'Create a shipping term' })
  @ApiCreatedResponse({ type: ShippingTermResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(@Body() dto: CreateShippingTermDto): Promise<ShippingTermResponseDto> {
    return this.shippingTermsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('settings.write')
  @ApiOperation({ summary: 'Update a shipping term' })
  @ApiOkResponse({ type: ShippingTermResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShippingTermDto,
  ): Promise<ShippingTermResponseDto> {
    return this.shippingTermsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('settings.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a shipping term' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.shippingTermsService.remove(id);
  }
}
