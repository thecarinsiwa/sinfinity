import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  PURCHASE_ORDER_STATUSES,
  type PurchaseOrderStatus,
} from '../purchase-order-statuses';

export class TransitionPurchaseOrderDto {
  @ApiProperty({ enum: PURCHASE_ORDER_STATUSES })
  @IsIn(PURCHASE_ORDER_STATUSES)
  toStatus!: PurchaseOrderStatus;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}
