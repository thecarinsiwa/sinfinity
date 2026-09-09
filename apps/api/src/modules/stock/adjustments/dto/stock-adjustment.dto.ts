import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export const ADJUSTMENT_REASONS = [
  'loss',
  'damage',
  'count',
  'other',
] as const;
export type AdjustmentReason = (typeof ADJUSTMENT_REASONS)[number];

export class CreateStockAdjustmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty()
  @IsUUID('all')
  warehouseId!: string;

  @ApiProperty()
  @IsUUID('all')
  productId!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Optional location for the inventory key',
  })
  @IsOptional()
  @IsUUID('all')
  locationId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  batchId?: string | null;

  @ApiProperty({
    example: '8.0000',
    description: 'Target quantity_on_hand after adjustment',
  })
  @IsString()
  @Matches(DECIMAL_REGEX, {
    message: 'quantityAfter must be a decimal string',
  })
  quantityAfter!: string;

  @ApiProperty({ enum: ADJUSTMENT_REASONS, example: 'count' })
  @IsIn([...ADJUSTMENT_REASONS])
  reason!: AdjustmentReason;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}

export class StockAdjustmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  warehouseId!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty({ example: '10.0000' })
  quantityBefore!: string;

  @ApiProperty({ example: '8.0000' })
  quantityAfter!: string;

  @ApiProperty({ enum: ADJUSTMENT_REASONS })
  reason!: AdjustmentReason;

  @ApiPropertyOptional({ nullable: true })
  adjustedBy!: string | null;

  @ApiProperty()
  adjustedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class ListStockAdjustmentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  productId?: string;

  @ApiPropertyOptional({ enum: ADJUSTMENT_REASONS })
  @IsOptional()
  @IsIn([...ADJUSTMENT_REASONS])
  reason?: AdjustmentReason;
}
