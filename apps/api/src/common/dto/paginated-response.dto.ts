import { ApiProperty } from '@nestjs/swagger';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../constants';

export class PaginationMetaDto {
  @ApiProperty({ example: DEFAULT_PAGE, minimum: 1 })
  page!: number;

  @ApiProperty({ example: DEFAULT_PAGE_SIZE, minimum: 1 })
  pageSize!: number;

  @ApiProperty({ example: 42, minimum: 0, description: 'Total matching rows' })
  total!: number;

  @ApiProperty({
    example: 3,
    minimum: 0,
    description: 'Total pages for the current pageSize',
  })
  totalPages!: number;
}

export class PaginatedResponseDto<TData> {
  @ApiProperty({ isArray: true })
  data!: TData[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

export function buildPaginatedResponse<TData>(
  data: TData[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResponseDto<TData> {
  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
    },
  };
}
