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
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';
import { ExchangeRateResponseDto } from './dto/exchange-rate-response.dto';
import {
  LatestExchangeRateQueryDto,
  ListExchangeRatesQueryDto,
} from './dto/list-exchange-rates-query.dto';
import { UpdateExchangeRateDto } from './dto/update-exchange-rate.dto';
import { ExchangeRatesService } from './exchange-rates.service';

@ApiTags('Settings')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Get()
  @RequirePermissions('settings.read')
  @ApiOperation({ summary: 'List exchange rates' })
  @ApiPaginatedResponse(ExchangeRateResponseDto)
  findAll(
    @Query() query: ListExchangeRatesQueryDto,
  ): Promise<PaginatedResponseDto<ExchangeRateResponseDto>> {
    return this.exchangeRatesService.findAll(query);
  }

  @Get('latest')
  @RequirePermissions('settings.read')
  @ApiOperation({
    summary: 'Latest exchange rate for a currency pair',
    description:
      'Resolves from/to ISO 4217 codes. Returns the newest rate with rateDate <= date (default: today UTC).',
  })
  @ApiOkResponse({ type: ExchangeRateResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findLatest(
    @Query() query: LatestExchangeRateQueryDto,
  ): Promise<ExchangeRateResponseDto> {
    return this.exchangeRatesService.findLatest(query);
  }

  @Get(':id')
  @RequirePermissions('settings.read')
  @ApiOperation({ summary: 'Get an exchange rate by id' })
  @ApiOkResponse({ type: ExchangeRateResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExchangeRateResponseDto> {
    return this.exchangeRatesService.findOne(id);
  }

  @Post()
  @RequirePermissions('settings.write')
  @ApiOperation({ summary: 'Create an exchange rate' })
  @ApiCreatedResponse({ type: ExchangeRateResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(@Body() dto: CreateExchangeRateDto): Promise<ExchangeRateResponseDto> {
    return this.exchangeRatesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('settings.write')
  @ApiOperation({ summary: 'Update an exchange rate' })
  @ApiOkResponse({ type: ExchangeRateResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExchangeRateDto,
  ): Promise<ExchangeRateResponseDto> {
    return this.exchangeRatesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('settings.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an exchange rate' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.exchangeRatesService.remove(id);
  }
}
