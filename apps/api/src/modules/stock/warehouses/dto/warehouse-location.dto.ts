import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/** Location codes like A-01-03 */
export const WAREHOUSE_LOCATION_CODE_REGEX = /^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/;

export class CreateWarehouseLocationDto {
  @ApiProperty({
    example: 'A-01-03',
    description: 'Aisle-rack-shelf style code',
  })
  @IsString()
  @MaxLength(64)
  @Matches(WAREHOUSE_LOCATION_CODE_REGEX, {
    message: 'code must look like A-01-03 (segments separated by hyphens)',
  })
  code!: string;

  @ApiPropertyOptional({ nullable: true, example: 'A' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  aisle?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '01' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  rack?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '03' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  shelf?: string | null;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateWarehouseLocationDto {
  @ApiPropertyOptional({ example: 'A-01-03' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(WAREHOUSE_LOCATION_CODE_REGEX, {
    message: 'code must look like A-01-03 (segments separated by hyphens)',
  })
  code?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  aisle?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  rack?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  shelf?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class WarehouseLocationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  warehouseId!: string;

  @ApiProperty({ example: 'A-01-03' })
  code!: string;

  @ApiPropertyOptional({ nullable: true })
  aisle!: string | null;

  @ApiPropertyOptional({ nullable: true })
  rack!: string | null;

  @ApiPropertyOptional({ nullable: true })
  shelf!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ListWarehouseLocationsQueryDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true || value === '1' || value === 1) {
      return true;
    }
    if (value === 'false' || value === false || value === '0' || value === 0) {
      return false;
    }
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'A-01' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;
}
