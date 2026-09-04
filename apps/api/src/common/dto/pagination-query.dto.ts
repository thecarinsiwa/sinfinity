import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  SORT_ORDER,
  type SortOrder,
} from '../constants';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: '1-based page index',
    minimum: 1,
    default: DEFAULT_PAGE,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = DEFAULT_PAGE;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
    default: DEFAULT_PAGE_SIZE,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize: number = DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({
    description: 'Field name used for sorting (whitelist per endpoint)',
    example: 'createdAt',
    maxLength: 64,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sort?: string;

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: Object.values(SORT_ORDER),
    default: SORT_ORDER.ASC,
    example: SORT_ORDER.ASC,
  })
  @IsOptional()
  @IsIn(Object.values(SORT_ORDER))
  order: SortOrder = SORT_ORDER.ASC;
}
