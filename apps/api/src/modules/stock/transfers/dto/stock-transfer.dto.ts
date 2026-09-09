import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  STOCK_TRANSFER_STATUSES,
  type StockTransferStatus,
} from '../stock-transfer-statuses';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class StockTransferLineDto {
  @ApiProperty()
  @IsUUID('all')
  productId!: string;

  @ApiProperty({ example: '5.0000' })
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  fromLocationId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  toLocationId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  batchId?: string | null;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Required when product is serialized; UUIDs of serial_numbers rows',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  serialIds?: string[];
}

export class CreateStockTransferDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'TRF-2026-001' })
  @IsString()
  @MaxLength(64)
  transferNumber!: string;

  @ApiProperty()
  @IsUUID('all')
  fromWarehouseId!: string;

  @ApiProperty()
  @IsUUID('all')
  toWarehouseId!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  requestedBy?: string | null;
}

export class UpdateStockTransferDto {
  @ApiPropertyOptional({ example: 'TRF-2026-001' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  transferNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  fromWarehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  toWarehouseId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  requestedBy?: string | null;
}

export class TransitionStockTransferDto {
  @ApiProperty({ enum: ['in_transit', 'completed', 'cancelled'] })
  @IsIn(['in_transit', 'completed', 'cancelled'])
  toStatus!: Exclude<StockTransferStatus, 'draft'>;

  @ApiPropertyOptional({
    type: [StockTransferLineDto],
    description:
      'Required for draft→in_transit. Optional otherwise (lines replayed from out movements).',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StockTransferLineDto)
  lines?: StockTransferLineDto[];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}

export class StockTransferResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ example: 'TRF-2026-001' })
  transferNumber!: string;

  @ApiProperty()
  fromWarehouseId!: string;

  @ApiProperty()
  toWarehouseId!: string;

  @ApiProperty({ enum: STOCK_TRANSFER_STATUSES })
  status!: StockTransferStatus;

  @ApiPropertyOptional({ nullable: true })
  transferredAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  requestedBy!: string | null;

  @ApiPropertyOptional({ nullable: true })
  approvedBy!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ListStockTransfersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'TRF-2026' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: STOCK_TRANSFER_STATUSES })
  @IsOptional()
  @IsIn([...STOCK_TRANSFER_STATUSES])
  status?: StockTransferStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  fromWarehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  toWarehouseId?: string;
}
