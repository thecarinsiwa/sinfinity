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
import { CountriesService } from './countries.service';
import { CountryResponseDto } from './dto/country-response.dto';
import { CreateCountryDto } from './dto/create-country.dto';
import { ListCountriesQueryDto } from './dto/list-countries-query.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

@ApiTags('Settings')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @RequirePermissions('settings.read')
  @ApiOperation({ summary: 'List countries' })
  @ApiPaginatedResponse(CountryResponseDto)
  findAll(
    @Query() query: ListCountriesQueryDto,
  ): Promise<PaginatedResponseDto<CountryResponseDto>> {
    return this.countriesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('settings.read')
  @ApiOperation({ summary: 'Get a country by id' })
  @ApiOkResponse({ type: CountryResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CountryResponseDto> {
    return this.countriesService.findOne(id);
  }

  @Post()
  @RequirePermissions('settings.write')
  @ApiOperation({ summary: 'Create a country' })
  @ApiCreatedResponse({ type: CountryResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(@Body() dto: CreateCountryDto): Promise<CountryResponseDto> {
    return this.countriesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('settings.write')
  @ApiOperation({ summary: 'Update a country' })
  @ApiOkResponse({ type: CountryResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCountryDto,
  ): Promise<CountryResponseDto> {
    return this.countriesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('settings.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a country' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.countriesService.remove(id);
  }
}
