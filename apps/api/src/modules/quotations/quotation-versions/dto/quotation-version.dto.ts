import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviseQuotationDto {
  @ApiPropertyOptional({
    example: 'Client requested updated pricing',
    description: 'Optional reason stored on the new version row',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  changeReason?: string | null;
}

export class QuotationVersionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  quotationId!: string;

  @ApiProperty({ example: 2 })
  versionNumber!: number;

  @ApiProperty({
    description: 'Full quotation snapshot (API-shaped camelCase JSON)',
  })
  snapshot!: Record<string, unknown>;

  @ApiPropertyOptional({ nullable: true })
  changedBy!: string | null;

  @ApiPropertyOptional({ nullable: true })
  changeReason!: string | null;

  @ApiProperty()
  createdAt!: string;
}

/** List item without embedding the heavy snapshot payload. */
export class QuotationVersionSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  quotationId!: string;

  @ApiProperty({ example: 2 })
  versionNumber!: number;

  @ApiPropertyOptional({ nullable: true })
  changedBy!: string | null;

  @ApiPropertyOptional({ nullable: true })
  changeReason!: string | null;

  @ApiProperty()
  createdAt!: string;
}
