import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class ListShippingTermsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'FOB' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  code?: string;

  @ApiPropertyOptional({ example: 'board' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ example: '2020' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  incotermVersion?: string;
}
