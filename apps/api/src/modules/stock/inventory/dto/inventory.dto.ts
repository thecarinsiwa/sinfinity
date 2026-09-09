import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export const MOVEMENT_TYPES = [
  'in',
  'out',
  'transfer',
  'adjustment',
  'reserve',
  'unreserve',
] as const;

export type MovementTypeDto = (typeof MOVEMENT_TYPES)[number];

export class InventoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  warehouseId!: string;

  @ApiPropertyOptional({ nullable: true })
  locationId!: string | null;

  @ApiProperty()
  productId!: string;

  @ApiPropertyOptional({ nullable: true })
  batchId!: string | null;

  @ApiProperty({ example: '10.0000' })
  quantityOnHand!: string;

  @ApiProperty({ example: '2.0000' })
  quantityReserved!: string;

  @ApiProperty({ example: '8.0000' })
  quantityAvailable!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ListInventoryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  batchId?: string;
}

export class InventoryMovementResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  warehouseId!: string;

  @ApiPropertyOptional({ nullable: true })
  locationId!: string | null;

  @ApiProperty({ enum: MOVEMENT_TYPES })
  movementType!: MovementTypeDto;

  @ApiProperty({ example: '5.0000' })
  quantity!: string;

  @ApiPropertyOptional({ nullable: true, example: 'purchase_receipt' })
  referenceType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  referenceId!: string | null;

  @ApiProperty()
  movedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  movedBy!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class ListInventoryMovementsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  warehouseId?: string;

  @ApiPropertyOptional({ enum: MOVEMENT_TYPES })
  @IsOptional()
  @IsIn([...MOVEMENT_TYPES])
  movementType?: MovementTypeDto;

  @ApiPropertyOptional({ example: 'purchase_receipt' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  referenceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  referenceId?: string;
}
