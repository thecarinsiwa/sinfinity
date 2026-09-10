import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateSupplierQuoteItemDto } from './supplier-quote-item.dto';

export class CreateSupplierQuoteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty()
  @IsUUID('all')
  supplierId!: string;

  @ApiPropertyOptional({
    example: 'SQ-2026-001',
    description: 'Unique per organization; auto-generated if omitted',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  quoteNumber?: string;

  @ApiPropertyOptional({
    example: '2026-09-10',
    description: 'Defaults to today (UTC date)',
  })
  @IsOptional()
  @IsDateString()
  quoteDate?: string;

  @ApiPropertyOptional({ nullable: true, example: '2026-10-10' })
  @IsOptional()
  @IsDateString()
  validUntil?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({ type: [CreateSupplierQuoteItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierQuoteItemDto)
  items?: CreateSupplierQuoteItemDto[];
}
