import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class ListActivityTypesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'CALL' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}
