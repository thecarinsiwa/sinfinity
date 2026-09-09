import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  PURCHASE_RECEIPT_STATUSES,
  type PurchaseReceiptStatus,
} from './purchase-receipt.dto';

export class ListPurchaseReceiptsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'BR-2026' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: PURCHASE_RECEIPT_STATUSES })
  @IsOptional()
  @IsIn(PURCHASE_RECEIPT_STATUSES)
  status?: PurchaseReceiptStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  purchaseOrderId?: string;
}
