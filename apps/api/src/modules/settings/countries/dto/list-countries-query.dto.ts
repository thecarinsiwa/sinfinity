import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class ListCountriesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'CD',
    description: 'Filter by ISO 3166-1 alpha-2 code',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Za-z]{2}$/)
  code?: string;

  @ApiPropertyOptional({
    example: 'congo',
    description: 'Case-insensitive search on name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}
