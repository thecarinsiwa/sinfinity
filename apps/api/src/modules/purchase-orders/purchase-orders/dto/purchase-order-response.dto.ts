import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PURCHASE_ORDER_STATUSES,
  type PurchaseOrderStatus,
} from '../purchase-order-statuses';
import { PurchaseOrderItemResponseDto } from './purchase-order-item.dto';

export class PurchaseOrderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ example: 'PO-2026-001' })
  poNumber!: string;

  @ApiProperty()
  supplierId!: string;

  @ApiPropertyOptional({ nullable: true })
  procurementRequestId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  procurementQuoteId!: string | null;

  @ApiProperty({ enum: PURCHASE_ORDER_STATUSES })
  status!: PurchaseOrderStatus;

  @ApiProperty({ example: '2026-09-04' })
  orderDate!: string;

  @ApiPropertyOptional({ nullable: true, example: '2026-10-01' })
  expectedDate!: string | null;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  shippingTermId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  paymentTermId!: string | null;

  @ApiProperty({ example: '0.0000' })
  subtotal!: string;

  @ApiProperty({ example: '0.0000' })
  taxAmount!: string;

  @ApiProperty({ example: '0.0000' })
  totalAmount!: string;

  @ApiPropertyOptional({ nullable: true })
  buyerUserId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ type: [PurchaseOrderItemResponseDto] })
  items?: PurchaseOrderItemResponseDto[];
}
