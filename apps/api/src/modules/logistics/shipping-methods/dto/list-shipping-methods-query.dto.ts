import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class ListShippingMethodsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'SEA' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  code?: string;

  @ApiPropertyOptional({ example: 'sea' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}
