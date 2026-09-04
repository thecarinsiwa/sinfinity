import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  PURCHASE_ORDER_STATUSES,
  type PurchaseOrderStatus,
} from '../purchase-order-statuses';

export class ListPurchaseOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'PO-2026' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: PURCHASE_ORDER_STATUSES })
  @IsOptional()
  @IsIn(PURCHASE_ORDER_STATUSES)
  status?: PurchaseOrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  procurementQuoteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  buyerUserId?: string;
}
