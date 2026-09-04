import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductSpecificationDto {
  @ApiProperty({ example: 'RAM' })
  @IsString()
  @MaxLength(128)
  specKey!: string;

  @ApiProperty({ example: '16' })
  @IsString()
  @MaxLength(512)
  specValue!: string;

  @ApiPropertyOptional({ nullable: true, example: 'GB' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  unit?: string | null;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateProductSpecificationDto {
  @ApiPropertyOptional({ example: 'RAM' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  specKey?: string;

  @ApiPropertyOptional({ example: '32' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  specValue?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  unit?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ProductSpecificationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty({ example: 'RAM' })
  specKey!: string;

  @ApiProperty({ example: '16' })
  specValue!: string;

  @ApiPropertyOptional({ nullable: true, example: 'GB' })
  unit!: string | null;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CreateProductImageDto {
  @ApiProperty({ example: 'https://cdn.example.com/switch.jpg' })
  @IsString()
  @MaxLength(512)
  url!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string | null;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateProductImageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  url?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ProductImageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  url!: string;

  @ApiPropertyOptional({ nullable: true })
  altText!: string | null;

  @ApiProperty()
  isPrimary!: boolean;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
