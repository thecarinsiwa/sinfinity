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
import { TAX_TYPES, type TaxType } from './create-tax.dto';

export class ListTaxesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'TVA' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;

  @ApiPropertyOptional({ enum: TAX_TYPES })
  @IsOptional()
  @IsIn(TAX_TYPES)
  taxType?: TaxType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  countryId?: string;

  @ApiPropertyOptional({
    description: 'When true, only global taxes (organization_id IS NULL)',
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
  globalOnly?: boolean;

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
