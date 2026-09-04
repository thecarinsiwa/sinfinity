import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductCategoryDto {
  @ApiPropertyOptional({
    description:
      'Defaults to the authenticated organization. Super-admin may set explicitly.',
  })
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'IT' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'Informatique' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Parent category id (same organization)',
  })
  @IsOptional()
  @IsUUID('all')
  parentId?: string | null;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
