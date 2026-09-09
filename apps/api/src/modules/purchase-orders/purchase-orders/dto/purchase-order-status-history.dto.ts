import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PURCHASE_ORDER_STATUSES,
  type PurchaseOrderStatus,
} from '../purchase-order-statuses';

export class PurchaseOrderStatusHistoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  purchaseOrderId!: string;

  @ApiPropertyOptional({
    enum: PURCHASE_ORDER_STATUSES,
    nullable: true,
    description: 'Null for the initial create/from-quote entry',
  })
  fromStatus!: PurchaseOrderStatus | null;

  @ApiProperty({ enum: PURCHASE_ORDER_STATUSES })
  toStatus!: PurchaseOrderStatus;

  @ApiPropertyOptional({ nullable: true })
  changedBy!: string | null;

  @ApiProperty()
  changedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;
}
