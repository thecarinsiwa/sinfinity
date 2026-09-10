import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import {
  SUPPLIER_QUOTE_STATUSES,
  type SupplierQuoteStatus,
} from '../supplier-quote-statuses';

export class TransitionSupplierQuoteDto {
  @ApiProperty({ enum: SUPPLIER_QUOTE_STATUSES })
  @IsIn(SUPPLIER_QUOTE_STATUSES)
  toStatus!: SupplierQuoteStatus;
}
