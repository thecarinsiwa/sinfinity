import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateProcurementQuoteItemDto } from './procurement-quote-item.dto';

export class CreateProcurementQuoteDto {
  @ApiProperty()
  @IsUUID('all')
  supplierId!: string;

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

  @ApiPropertyOptional({
    nullable: true,
    description: 'Incoterm (shipping_terms)',
  })
  @IsOptional()
  @IsUUID('all')
  shippingTermId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 21 })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number | null;

  @ApiPropertyOptional({ type: [CreateProcurementQuoteItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CreateProcurementQuoteItemDto)
  items?: CreateProcurementQuoteItemDto[];
}
