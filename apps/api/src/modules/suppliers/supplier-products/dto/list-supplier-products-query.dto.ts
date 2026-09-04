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

export class ListSupplierProductsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Scope via supplier organization (super-admin)',
  })
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({
    description: 'Filter by supplier (catalog of one supplier)',
  })
  @IsOptional()
  @IsUUID('all')
  supplierId?: string;

  @ApiPropertyOptional({
    description: 'Who sells this product (list suppliers offering productId)',
  })
  @IsOptional()
  @IsUUID('all')
  productId?: string;

  @ApiPropertyOptional({ example: 'SZ-SW' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  search?: string;

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
  isAvailable?: boolean;
}
