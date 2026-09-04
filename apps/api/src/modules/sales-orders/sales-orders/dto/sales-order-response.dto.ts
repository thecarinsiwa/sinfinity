import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SALES_ORDER_STATUSES,
  type SalesOrderStatus,
} from '../sales-order-statuses';
import { SalesOrderItemResponseDto } from './sales-order-item.dto';

export class SalesOrderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ example: 'SO-2026-001' })
  orderNumber!: string;

  @ApiProperty()
  customerId!: string;

  @ApiPropertyOptional({ nullable: true })
  quotationId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  branchId!: string | null;

  @ApiProperty({ enum: SALES_ORDER_STATUSES })
  status!: SalesOrderStatus;

  @ApiProperty({ example: '2026-09-04' })
  orderDate!: string;

  @ApiPropertyOptional({ nullable: true, example: '2026-09-20' })
  requestedDeliveryDate!: string | null;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiProperty({ example: '0.0000' })
  subtotal!: string;

  @ApiProperty({ example: '0.0000' })
  taxAmount!: string;

  @ApiProperty({ example: '0.0000' })
  totalAmount!: string;

  @ApiPropertyOptional({ nullable: true })
  billingAddressId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  shippingAddressId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  ownerUserId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ type: [SalesOrderItemResponseDto] })
  items?: SalesOrderItemResponseDto[];
}
