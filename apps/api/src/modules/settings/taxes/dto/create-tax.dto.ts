import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export const TAX_TYPES = ['vat', 'customs', 'withholding', 'other'] as const;

export type TaxType = (typeof TAX_TYPES)[number];

export class CreateTaxDto {
  @ApiPropertyOptional({
    description:
      'Organization scope. Omit or null for a global tax. Defaults to current org when provided via decorator context.',
    nullable: true,
  })
  @IsOptional()
  @IsUUID('all')
  organizationId?: string | null;

  @ApiProperty({ example: 'TVA16' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'TVA RDC 16%' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    example: '16.0000',
    description: 'Tax rate % as decimal string',
  })
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'rate must be a decimal string' })
  rate!: string;

  @ApiProperty({ enum: TAX_TYPES, example: 'vat' })
  @IsIn(TAX_TYPES)
  taxType!: TaxType;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  countryId?: string | null;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
