import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  SALES_ORDER_STATUSES,
  type SalesOrderStatus,
} from '../sales-order-statuses';

export class ListSalesOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'SO-2026' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: SALES_ORDER_STATUSES })
  @IsOptional()
  @IsIn(SALES_ORDER_STATUSES)
  status?: SalesOrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  quotationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  ownerUserId?: string;
}
