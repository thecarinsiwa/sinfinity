import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateSalesOrderItemDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  productId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  serviceId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Firewall appliance' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    example: '2.0000',
    default: '1.0000',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity?: string;

  @ApiPropertyOptional({
    example: '1250.0000',
    default: '0.0000',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'unitPrice must be a decimal string' })
  unitPrice?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  taxId?: string | null;
}

export class UpdateSalesOrderItemDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  productId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  serviceId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: '3.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity?: string;

  @ApiPropertyOptional({
    example: '0.0000',
    description: 'Must not exceed quantity',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, {
    message: 'quantityDelivered must be a decimal string',
  })
  quantityDelivered?: string;

  @ApiPropertyOptional({ example: '1100.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'unitPrice must be a decimal string' })
  unitPrice?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  taxId?: string | null;
}

export class SalesOrderItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  salesOrderId!: string;

  @ApiPropertyOptional({ nullable: true })
  productId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  serviceId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ example: '2.0000' })
  quantity!: string;

  @ApiProperty({ example: '0.0000' })
  quantityDelivered!: string;

  @ApiProperty({ example: '1250.0000' })
  unitPrice!: string;

  @ApiPropertyOptional({ nullable: true })
  taxId!: string | null;

  @ApiProperty({ example: '2500.0000' })
  lineTotal!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
