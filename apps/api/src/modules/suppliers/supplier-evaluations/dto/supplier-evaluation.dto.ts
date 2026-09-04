import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

function toOptionalBoolean({ value }: { value: unknown }): unknown {
  if (value === 'true' || value === true || value === '1' || value === 1) {
    return true;
  }
  if (value === 'false' || value === false || value === '0' || value === 0) {
    return false;
  }
  return value;
}

export class CreateSupplierEvaluationDto {
  @ApiProperty()
  @IsUUID('all')
  supplierId!: string;

  @ApiPropertyOptional({
    example: '2026-09-04',
    description: 'ISO date (YYYY-MM-DD); defaults to today UTC',
  })
  @IsOptional()
  @IsDateString()
  evaluatedAt?: string;

  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  qualityScore?: number | null;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  deliveryScore?: number | null;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 5, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  priceScore?: number | null;

  @ApiPropertyOptional({
    example: '4.00',
    description:
      'Decimal string; defaults to average of provided scores when omitted',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'overallScore must be a decimal string' })
  overallScore?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  comments?: string | null;

  @ApiPropertyOptional({
    description:
      'When true, set suppliers.rating = overallScore and append history evaluation',
    default: false,
  })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  updateSupplierRating?: boolean;
}

export class UpdateSupplierEvaluationDto {
  @ApiPropertyOptional({ example: '2026-09-04' })
  @IsOptional()
  @IsDateString()
  evaluatedAt?: string;

  @ApiPropertyOptional({ nullable: true, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  qualityScore?: number | null;

  @ApiPropertyOptional({ nullable: true, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  deliveryScore?: number | null;

  @ApiPropertyOptional({ nullable: true, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  priceScore?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'overallScore must be a decimal string' })
  overallScore?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  comments?: string | null;

  @ApiPropertyOptional({
    description:
      'When true, set suppliers.rating = overallScore and append history evaluation',
  })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  updateSupplierRating?: boolean;
}

export class ListSupplierEvaluationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  supplierId?: string;
}

export class UpdateSupplierRatingQueryDto {
  @ApiPropertyOptional({
    description:
      'When true, set suppliers.rating = overallScore and append history evaluation',
    default: false,
  })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  updateSupplierRating?: boolean;
}

export class SupplierEvaluationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  supplierId!: string;

  @ApiPropertyOptional({ nullable: true })
  evaluatedBy!: string | null;

  @ApiProperty({ example: '2026-09-04' })
  evaluatedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  qualityScore!: number | null;

  @ApiPropertyOptional({ nullable: true })
  deliveryScore!: number | null;

  @ApiPropertyOptional({ nullable: true })
  priceScore!: number | null;

  @ApiPropertyOptional({ nullable: true, example: '4.00' })
  overallScore!: string | null;

  @ApiPropertyOptional({ nullable: true })
  comments!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
