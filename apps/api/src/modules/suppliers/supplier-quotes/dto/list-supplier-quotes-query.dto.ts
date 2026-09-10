import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  SUPPLIER_QUOTE_STATUSES,
  type SupplierQuoteStatus,
} from '../supplier-quote-statuses';

export class ListSupplierQuotesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  supplierId?: string;

  @ApiPropertyOptional({ enum: SUPPLIER_QUOTE_STATUSES })
  @IsOptional()
  @IsIn(SUPPLIER_QUOTE_STATUSES)
  status?: SupplierQuoteStatus;

  @ApiPropertyOptional({ example: 'SQ-2026' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;
}
