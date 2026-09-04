import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { BRANCH_TYPES, type BranchType } from './create-branch.dto';

export class ListBranchesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by organization (super-admin). Ignored for org users.',
  })
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'HQ' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: BRANCH_TYPES })
  @IsOptional()
  @IsIn(BRANCH_TYPES)
  type?: BranchType;

  @ApiPropertyOptional()
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
  isActive?: boolean;
}
