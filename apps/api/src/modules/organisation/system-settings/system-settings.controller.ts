import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  ApiPaginatedResponse,
  CurrentUser,
  ErrorResponseDto,
  JwtAuthGuard,
  OrganizationId,
  PermissionsGuard,
  RequirePermissions,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import { ListSystemSettingsQueryDto } from './dto/list-system-settings-query.dto';
import { SystemSettingResponseDto } from './dto/system-setting-response.dto';
import {
  BulkUpsertSystemSettingsDto,
  SYSTEM_SETTING_KEY_PATTERN,
  UpsertSystemSettingDto,
} from './dto/upsert-system-setting.dto';
import { SystemSettingsService } from './system-settings.service';

class SystemSettingKeyParam {
  @IsString()
  @MaxLength(128)
  @Matches(SYSTEM_SETTING_KEY_PATTERN, {
    message:
      'key must start with a letter and contain only letters, digits, ".", "_" or "-"',
  })
  key!: string;
}

@ApiTags(SWAGGER_TAG.Organisation)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  @RequirePermissions('system_settings.read')
  @ApiOperation({
    summary: 'List organization system settings',
  })
  @ApiPaginatedResponse(SystemSettingResponseDto)
  findAll(
    @Query() query: ListSystemSettingsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<SystemSettingResponseDto>> {
    return this.systemSettingsService.findAll(query, organizationId, user);
  }

  @Put()
  @RequirePermissions('system_settings.write')
  @ApiOperation({
    summary: 'Bulk upsert system settings',
    description: 'Creates or updates each key for the current organization.',
  })
  @ApiOkResponse({ type: [SystemSettingResponseDto] })
  @ApiConflictResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  bulkUpsert(
    @Body() dto: BulkUpsertSystemSettingsDto,
    @Query('organizationId') queryOrganizationId: string | undefined,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SystemSettingResponseDto[]> {
    return this.systemSettingsService.bulkUpsert(
      dto.settings,
      organizationId,
      user,
      queryOrganizationId,
    );
  }

  @Get(':key')
  @RequirePermissions('system_settings.read')
  @ApiOperation({ summary: 'Get a system setting by key' })
  @ApiParam({ name: 'key', example: 'default_currency' })
  @ApiOkResponse({ type: SystemSettingResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findByKey(
    @Param() params: SystemSettingKeyParam,
    @Query('organizationId') queryOrganizationId: string | undefined,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SystemSettingResponseDto> {
    return this.systemSettingsService.findByKey(
      params.key,
      organizationId,
      user,
      queryOrganizationId,
    );
  }

  @Put(':key')
  @RequirePermissions('system_settings.write')
  @ApiOperation({
    summary: 'Upsert a system setting by key',
    description: 'Creates the key if missing; updates value/description otherwise.',
  })
  @ApiParam({ name: 'key', example: 'default_currency' })
  @ApiOkResponse({ type: SystemSettingResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  upsertByKey(
    @Param() params: SystemSettingKeyParam,
    @Body() dto: UpsertSystemSettingDto,
    @Query('organizationId') queryOrganizationId: string | undefined,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SystemSettingResponseDto> {
    return this.systemSettingsService.upsertByKey(
      params.key,
      dto,
      organizationId,
      user,
      queryOrganizationId,
    );
  }
}
