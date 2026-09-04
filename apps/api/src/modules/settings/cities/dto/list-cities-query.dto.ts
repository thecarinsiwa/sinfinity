import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class ListCitiesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: '0191e6b8-4c3a-7b2d-9f1e-2a3b4c5d6e7f',
  })
  @IsOptional()
  @IsUUID('all')
  countryId?: string;

  @ApiPropertyOptional({
    example: 'CD',
    description: 'Filter by parent country ISO alpha-2',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Za-z]{2}$/)
  countryCode?: string;

  @ApiPropertyOptional({
    example: 'kin',
    description: 'Case-insensitive search on city name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}
