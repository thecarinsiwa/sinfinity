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

export const RESERVATION_STATUSES = [
  'active',
  'released',
  'fulfilled',
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export class CreateStockReservationDto {
  @ApiProperty()
  @IsUUID('all')
  inventoryId!: string;

  @ApiProperty()
  @IsUUID('all')
  salesOrderItemId!: string;

  @ApiProperty({ example: '2.0000' })
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'ISO datetime; optional expiry',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  expiresAt?: string | null;
}

export class StockReservationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  inventoryId!: string;

  @ApiPropertyOptional({ nullable: true })
  salesOrderId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  salesOrderItemId!: string | null;

  @ApiProperty({ example: '2.0000' })
  quantity!: string;

  @ApiProperty({ enum: RESERVATION_STATUSES })
  status!: ReservationStatus;

  @ApiProperty()
  reservedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  expiresAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ListStockReservationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  inventoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  salesOrderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  salesOrderItemId?: string;

  @ApiPropertyOptional({ enum: RESERVATION_STATUSES })
  @IsOptional()
  @IsIn([...RESERVATION_STATUSES])
  status?: ReservationStatus;
}
