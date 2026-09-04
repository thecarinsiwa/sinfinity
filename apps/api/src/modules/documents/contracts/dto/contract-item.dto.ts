import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateContractItemDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  productId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  serviceId?: string | null;

  @ApiPropertyOptional({
    example: 'Annual maintenance package',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    example: '1.0000',
    description: 'Quantity as decimal string',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity?: string | null;

  @ApiPropertyOptional({
    example: '1500.0000',
    description: 'Unit price as decimal string',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'unitPrice must be a decimal string' })
  unitPrice?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}

export class UpdateContractItemDto {
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

  @ApiPropertyOptional({
    example: '2.0000',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity?: string | null;

  @ApiPropertyOptional({
    example: '1200.0000',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'unitPrice must be a decimal string' })
  unitPrice?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}

export class ContractItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  contractId!: string;

  @ApiPropertyOptional({ nullable: true })
  productId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  serviceId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Decimal string',
    example: '1.0000',
  })
  quantity!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Decimal string',
    example: '1500.0000',
  })
  unitPrice!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export const CONTRACT_STATUSES = [
  'draft',
  'active',
  'expired',
  'terminated',
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];
