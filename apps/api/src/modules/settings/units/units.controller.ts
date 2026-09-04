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
import { CreateUnitDto } from './dto/create-unit.dto';
import { ListUnitsQueryDto } from './dto/list-units-query.dto';
import { UnitResponseDto } from './dto/unit-response.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitsService } from './units.service';

@ApiTags('Settings')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  @RequirePermissions('settings.read')
  @ApiOperation({
    summary: 'List units',
    description: 'Suitable for UI select lists (use pageSize up to 100).',
  })
  @ApiPaginatedResponse(UnitResponseDto)
  findAll(
    @Query() query: ListUnitsQueryDto,
  ): Promise<PaginatedResponseDto<UnitResponseDto>> {
    return this.unitsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('settings.read')
  @ApiOperation({ summary: 'Get a unit by id' })
  @ApiOkResponse({ type: UnitResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UnitResponseDto> {
    return this.unitsService.findOne(id);
  }

  @Post()
  @RequirePermissions('settings.write')
  @ApiOperation({ summary: 'Create a unit' })
  @ApiCreatedResponse({ type: UnitResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(@Body() dto: CreateUnitDto): Promise<UnitResponseDto> {
    return this.unitsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('settings.write')
  @ApiOperation({ summary: 'Update a unit' })
  @ApiOkResponse({ type: UnitResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUnitDto,
  ): Promise<UnitResponseDto> {
    return this.unitsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('settings.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a unit' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.unitsService.remove(id);
  }
}
