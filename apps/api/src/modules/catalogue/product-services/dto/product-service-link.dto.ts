import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateProductServiceLinkDto {
  @ApiProperty()
  @IsUUID('all')
  serviceId!: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    example: '1.0000',
    default: '1.0000',
    description: 'Suggested quantity as decimal string',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, {
    message: 'defaultQuantity must be a decimal string',
  })
  defaultQuantity?: string;
}

export class UpdateProductServiceLinkDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    example: '2.0000',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, {
    message: 'defaultQuantity must be a decimal string',
  })
  defaultQuantity?: string;
}

export class ProductServiceLinkResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  serviceId!: string;

  @ApiProperty()
  isRequired!: boolean;

  @ApiProperty({
    example: '1.0000',
    description: 'Decimal string',
  })
  defaultQuantity!: string;

  @ApiProperty({ example: 'INST-SW' })
  serviceCode!: string;

  @ApiProperty({ example: 'Switch installation' })
  serviceName!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
