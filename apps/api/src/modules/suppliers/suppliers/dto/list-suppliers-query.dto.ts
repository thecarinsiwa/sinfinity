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
import {
  SUPPLIER_STATUSES,
  type SupplierStatus,
} from './create-supplier.dto';

export class ListSuppliersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'Shenzhen' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: SUPPLIER_STATUSES })
  @IsOptional()
  @IsIn(SUPPLIER_STATUSES)
  status?: SupplierStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  categoryId?: string;

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
  preferred?: boolean;
}
