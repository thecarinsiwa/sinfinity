import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateProcurementQuoteItemDto {
  @ApiPropertyOptional({
    nullable: true,
    description: 'Must belong to the parent procurement request',
  })
  @IsOptional()
  @IsUUID('all')
  procurementRequestItemId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  productId?: string | null;

  @ApiPropertyOptional({
    example: '40.0000',
    default: '1.0000',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity?: string;

  @ApiPropertyOptional({
    example: '95.0000',
    default: '0.0000',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'unitPrice must be a decimal string' })
  unitPrice?: string;

  @ApiPropertyOptional({ nullable: true, example: 14 })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class UpdateProcurementQuoteItemDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  procurementRequestItemId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  productId?: string | null;

  @ApiPropertyOptional({ example: '40.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity?: string;

  @ApiPropertyOptional({ example: '95.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'unitPrice must be a decimal string' })
  unitPrice?: string;

  @ApiPropertyOptional({ nullable: true, example: 14 })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class ProcurementQuoteItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  procurementQuoteId!: string;

  @ApiPropertyOptional({ nullable: true })
  procurementRequestItemId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  productId!: string | null;

  @ApiProperty({ example: '40.0000' })
  quantity!: string;

  @ApiProperty({ example: '95.0000' })
  unitPrice!: string;

  @ApiPropertyOptional({ nullable: true })
  leadTimeDays!: number | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty({ example: '3800.0000' })
  lineTotal!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
