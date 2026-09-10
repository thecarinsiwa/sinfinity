import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class ListLoginLogsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'admin@',
    description: 'Partial match on email_attempted',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by login success (true) or failure (false)',
  })
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
  success?: boolean;

  @ApiPropertyOptional({
    description: 'Inclusive lower bound (ISO date or datetime)',
    example: '2026-09-01',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Inclusive upper bound (ISO date or datetime)',
    example: '2026-09-30',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  dateTo?: string;
}
