import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'converted',
  'lost',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Statuses that can be set via PATCH (not convert). */
export const LEAD_PATCH_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'lost',
] as const;
export type LeadPatchStatus = (typeof LEAD_PATCH_STATUSES)[number];

export class CreateLeadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  sourceId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Acme SA' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  phone?: string | null;

  @ApiPropertyOptional({
    enum: LEAD_PATCH_STATUSES,
    default: 'new',
    description: 'Initial status; use POST convert for converted',
  })
  @IsOptional()
  @IsIn(LEAD_PATCH_STATUSES)
  status?: LeadPatchStatus;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  ownerUserId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: '15000.0000',
    description: 'Decimal string',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, {
    message: 'estimatedValue must be a decimal string',
  })
  estimatedValue?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;
}
