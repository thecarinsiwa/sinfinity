import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateProcurementQuoteDto {
  @ApiPropertyOptional({ nullable: true, example: 'SQ-2026-001' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  quoteNumber?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2026-09-04' })
  @IsOptional()
  @IsDateString()
  quoteDate?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2026-09-30' })
  @IsOptional()
  @IsDateString()
  validUntil?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  shippingTermId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 21 })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number | null;
}
