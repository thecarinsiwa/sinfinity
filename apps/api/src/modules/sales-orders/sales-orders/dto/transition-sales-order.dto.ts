import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  SALES_ORDER_STATUSES,
  type SalesOrderStatus,
} from '../sales-order-statuses';

export class TransitionSalesOrderDto {
  @ApiProperty({ enum: SALES_ORDER_STATUSES })
  @IsIn(SALES_ORDER_STATUSES)
  toStatus!: SalesOrderStatus;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}
