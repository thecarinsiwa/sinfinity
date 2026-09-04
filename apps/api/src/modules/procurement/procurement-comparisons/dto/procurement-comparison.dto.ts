import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProcurementComparisonDto {
  @ApiPropertyOptional({
    description: 'Free-form criteria JSON (price, lead time, quality…)',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  criteria?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'Free-form scores JSON keyed by quote id or criterion',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  scores?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Must belong to this procurement request',
  })
  @IsOptional()
  @IsUUID('all')
  selectedQuoteId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  recommendation?: string | null;
}

export class ProcurementComparisonResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  procurementRequestId!: string;

  @ApiPropertyOptional({ nullable: true })
  comparedBy!: string | null;

  @ApiProperty()
  comparedAt!: string;

  @ApiPropertyOptional({ nullable: true, additionalProperties: true })
  criteria!: Record<string, unknown> | null;

  @ApiPropertyOptional({ nullable: true, additionalProperties: true })
  scores!: Record<string, unknown> | null;

  @ApiPropertyOptional({ nullable: true })
  selectedQuoteId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  recommendation!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
