import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ProductImageResponseDto,
  ProductSpecificationResponseDto,
} from './product-nested.dto';

export class ProductResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ example: 'SW-C9300-24T' })
  sku!: string;

  @ApiProperty({ example: 'Cisco Catalyst 9300 24T' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  categoryId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  subcategoryId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  brandId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  modelId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  unitId!: string | null;

  @ApiProperty({
    example: '1250.0000',
    description: 'Decimal string',
  })
  basePrice!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: '850.0000',
    description: 'Decimal string',
  })
  costPrice!: string | null;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiProperty()
  isSerialized!: boolean;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({
    type: [ProductSpecificationResponseDto],
    description: 'Present on get-by-id and create',
  })
  specifications?: ProductSpecificationResponseDto[];

  @ApiPropertyOptional({
    type: [ProductImageResponseDto],
    description: 'Present on get-by-id and create',
  })
  images?: ProductImageResponseDto[];
}
