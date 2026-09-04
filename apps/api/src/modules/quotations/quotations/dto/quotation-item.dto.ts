import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateQuotationItemDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lineNumber?: number;

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
    description: 'Decimal string',
    default: '1.0000',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  unitId?: string | null;

  @ApiPropertyOptional({
    example: '1250.0000',
    description: 'Decimal string',
    default: '0.0000',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'unitPrice must be a decimal string' })
  unitPrice?: string;

  @ApiPropertyOptional({
    example: '0.0000',
    description: 'Discount % as decimal string',
    default: '0.0000',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, {
    message: 'discountPercent must be a decimal string',
  })
  discountPercent?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  taxId?: string | null;
}

export class UpdateQuotationItemDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lineNumber?: number;

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

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  unitId?: string | null;

  @ApiPropertyOptional({ example: '1100.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'unitPrice must be a decimal string' })
  unitPrice?: string;

  @ApiPropertyOptional({ example: '5.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, {
    message: 'discountPercent must be a decimal string',
  })
  discountPercent?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  taxId?: string | null;
}

export class QuotationItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  quotationId!: string;

  @ApiProperty({ example: 1 })
  lineNumber!: number;

  @ApiPropertyOptional({ nullable: true })
  productId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  serviceId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ example: '2.0000', description: 'Decimal string' })
  quantity!: string;

  @ApiPropertyOptional({ nullable: true })
  unitId!: string | null;

  @ApiProperty({ example: '1250.0000', description: 'Decimal string' })
  unitPrice!: string;

  @ApiProperty({ example: '0.0000', description: 'Decimal string' })
  discountPercent!: string;

  @ApiPropertyOptional({ nullable: true })
  taxId!: string | null;

  @ApiProperty({
    example: '2500.0000',
    description: 'HT after discount (server-computed)',
  })
  lineTotal!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
