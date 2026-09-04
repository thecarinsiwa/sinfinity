import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateProcurementRequestItemDto {
  @ApiPropertyOptional({
    nullable: true,
    description: 'Nullable when free-text specification is used',
  })
  @IsOptional()
  @IsUUID('all')
  productId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: '48-port PoE switch, Layer 3',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    example: '40.0000',
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

  @ApiPropertyOptional({ nullable: true, example: '120.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, {
    message: 'targetUnitPrice must be a decimal string',
  })
  targetUnitPrice?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;
}

export class UpdateProcurementRequestItemDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  productId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: '40.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  unitId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '120.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, {
    message: 'targetUnitPrice must be a decimal string',
  })
  targetUnitPrice?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;
}

export class ProcurementRequestItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  procurementRequestId!: string;

  @ApiPropertyOptional({ nullable: true })
  productId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ example: '40.0000' })
  quantity!: string;

  @ApiPropertyOptional({ nullable: true })
  unitId!: string | null;

  @ApiPropertyOptional({ nullable: true, example: '120.0000' })
  targetUnitPrice!: string | null;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
