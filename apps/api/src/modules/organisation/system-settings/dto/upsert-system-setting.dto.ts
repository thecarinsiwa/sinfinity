import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Allow,
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9._-]*$/;

export class UpsertSystemSettingDto {
  @ApiProperty({
    description: 'JSON value (object, array, or primitive)',
    example: { code: 'USD', precision: 2 },
  })
  @Allow()
  value!: unknown;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class UpsertSystemSettingItemDto extends UpsertSystemSettingDto {
  @ApiProperty({ example: 'default_currency' })
  @IsString()
  @MaxLength(128)
  @Matches(KEY_PATTERN, {
    message:
      'key must start with a letter and contain only letters, digits, ".", "_" or "-"',
  })
  key!: string;
}

export class BulkUpsertSystemSettingsDto {
  @ApiProperty({ type: [UpsertSystemSettingItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UpsertSystemSettingItemDto)
  settings!: UpsertSystemSettingItemDto[];
}

export { KEY_PATTERN as SYSTEM_SETTING_KEY_PATTERN };
