import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateLandedCostItemDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  productId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  purchaseOrderItemId?: string | null;

  @ApiPropertyOptional({
    example: '10.0000',
    default: '1.0000',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity?: string;

  @ApiPropertyOptional({
    example: '950.0000',
    default: '0.0000',
    description: 'Goods cost in the landed cost header currency',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'goodsCost must be a decimal string' })
  goodsCost?: string;
}

export class UpdateLandedCostItemDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  productId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  purchaseOrderItemId?: string | null;

  @ApiPropertyOptional({ example: '10.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity?: string;

  @ApiPropertyOptional({ example: '950.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'goodsCost must be a decimal string' })
  goodsCost?: string;
}

export class LandedCostItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  landedCostId!: string;

  @ApiPropertyOptional({ nullable: true })
  productId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  purchaseOrderItemId!: string | null;

  @ApiProperty({ example: '10.0000' })
  quantity!: string;

  @ApiProperty({ example: '950.0000' })
  goodsCost!: string;

  @ApiProperty({ example: '0.0000' })
  allocatedCosts!: string;

  @ApiProperty({ example: '0.0000' })
  unitLandedCost!: string;

  @ApiProperty({ example: '0.0000' })
  totalLandedCost!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
