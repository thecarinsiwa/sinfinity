import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateOpportunityItemDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  productId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  serviceId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Cisco Catalyst 9300',
  })
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
    example: '2500.0000',
    description:
      'Decimal string; when omitted, computed as quantity * unitPrice',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'lineTotal must be a decimal string' })
  lineTotal?: string;
}

export class UpdateOpportunityItemDto {
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
  @MaxLength(5000)
  description?: string | null;

  @ApiPropertyOptional({
    example: '3.0000',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity?: string;

  @ApiPropertyOptional({
    example: '1100.0000',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'unitPrice must be a decimal string' })
  unitPrice?: string;

  @ApiPropertyOptional({
    example: '3300.0000',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'lineTotal must be a decimal string' })
  lineTotal?: string;
}

export class OpportunityItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  opportunityId!: string;

  @ApiPropertyOptional({ nullable: true })
  productId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  serviceId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ example: '2.0000', description: 'Decimal string' })
  quantity!: string;

  @ApiProperty({ example: '1250.0000', description: 'Decimal string' })
  unitPrice!: string;

  @ApiProperty({ example: '2500.0000', description: 'Decimal string' })
  lineTotal!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
