import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateSupplierProductDto {
  @ApiProperty()
  @IsUUID('all')
  supplierId!: string;

  @ApiProperty()
  @IsUUID('all')
  productId!: string;

  @ApiPropertyOptional({ nullable: true, example: 'SZ-SW-9300' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  supplierSku?: string | null;

  @ApiPropertyOptional({
    example: '850.0000',
    description: 'Decimal string',
    default: '0.0000',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'unitPrice must be a decimal string' })
  unitPrice?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: '10.0000',
    description: 'Minimum order quantity as decimal string',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'moq must be a decimal string' })
  moq?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 21 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  leadTimeDays?: number | null;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
