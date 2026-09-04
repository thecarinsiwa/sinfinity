import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

/** Decimal as string — never float. */
const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateExchangeRateDto {
  @ApiProperty({ example: '0191e6b8-4c3a-7b2d-9f1e-aaaaaaaaaaaa' })
  @IsUUID('all')
  fromCurrencyId!: string;

  @ApiProperty({ example: '0191e6b8-4c3a-7b2d-9f1e-bbbbbbbbbbbb' })
  @IsUUID('all')
  toCurrencyId!: string;

  @ApiProperty({
    example: '2850.50000000',
    description: 'Exchange rate as decimal string',
  })
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'rate must be a decimal string' })
  rate!: string;

  @ApiProperty({ example: '2026-09-04' })
  @IsDateString()
  rateDate!: string;

  @ApiPropertyOptional({ example: 'manual' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  source?: string;
}
