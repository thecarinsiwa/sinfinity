import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SALES_ORDER_STATUSES,
  type SalesOrderStatus,
} from '../sales-order-statuses';

export class SalesOrderStatusHistoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  salesOrderId!: string;

  @ApiPropertyOptional({
    enum: SALES_ORDER_STATUSES,
    nullable: true,
    description: 'Null for the initial create/convert entry',
  })
  fromStatus!: SalesOrderStatus | null;

  @ApiProperty({ enum: SALES_ORDER_STATUSES })
  toStatus!: SalesOrderStatus;

  @ApiPropertyOptional({ nullable: true })
  changedBy!: string | null;

  @ApiProperty()
  changedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;
}
