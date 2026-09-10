import {
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import {
  ErrorResponseDto,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import type { Env } from '../../../config/env.validation';
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import {
  SettingsSeedService,
  type SeedBucketResult,
  type SettingsSeedResult,
} from './settings-seed.service';

class SeedBucketDto implements SeedBucketResult {
  @ApiProperty()
  inserted!: number;

  @ApiProperty()
  updated!: number;
}

class SettingsSeedDetailsDto {
  @ApiProperty({ type: SeedBucketDto })
  currencies!: SeedBucketDto;

  @ApiProperty({ type: SeedBucketDto })
  countries!: SeedBucketDto;

  @ApiProperty({ type: SeedBucketDto })
  cities!: SeedBucketDto;

  @ApiProperty({ type: SeedBucketDto })
  units!: SeedBucketDto;

  @ApiProperty({ type: SeedBucketDto })
  shippingTerms!: SeedBucketDto;

  @ApiProperty({ type: SeedBucketDto })
  paymentTerms!: SeedBucketDto;

  @ApiProperty({ type: SeedBucketDto })
  taxes!: SeedBucketDto;
}

class SettingsSeedResponseDto implements SettingsSeedResult {
  @ApiProperty()
  inserted!: number;

  @ApiProperty()
  updated!: number;

  @ApiProperty({ type: SettingsSeedDetailsDto })
  details!: SettingsSeedDetailsDto;
}

@ApiTags(SWAGGER_TAG.Settings)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('settings')
export class SettingsSeedController {
  constructor(
    private readonly settingsSeedService: SettingsSeedService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('settings.write')
  @ApiOperation({
    summary: 'Re-seed global reference data (development only)',
    description:
      'Idempotent upsert of currencies, countries, cities, units, Incoterms, ' +
      'global payment terms and TVA RDC. Rejected outside NODE_ENV=development.',
  })
  @ApiOkResponse({ type: SettingsSeedResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  async seed(): Promise<SettingsSeedResult> {
    const nodeEnv = this.config.get('NODE_ENV', { infer: true });
    if (nodeEnv !== 'development') {
      throw new ForbiddenException(
        'POST /settings/seed is only available when NODE_ENV=development',
      );
    }
    return this.settingsSeedService.seed();
  }
}
