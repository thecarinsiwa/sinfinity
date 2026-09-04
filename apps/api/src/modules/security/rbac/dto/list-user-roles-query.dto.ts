import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

export class ListUserRolesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  roleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  branchId?: string;
}
