import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PROCUREMENT_QUOTE_STATUSES,
  type ProcurementQuoteStatus,
} from '../procurement-quote-statuses';
import { ProcurementQuoteItemResponseDto } from './procurement-quote-item.dto';

export class ProcurementQuoteResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  procurementRequestId!: string;

  @ApiProperty()
  supplierId!: string;

  @ApiPropertyOptional({ nullable: true, example: 'SQ-2026-001' })
  quoteNumber!: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2026-09-04' })
  quoteDate!: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2026-09-30' })
  validUntil!: string | null;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  shippingTermId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  leadTimeDays!: number | null;

  @ApiProperty({ enum: PROCUREMENT_QUOTE_STATUSES })
  status!: ProcurementQuoteStatus;

  @ApiProperty({ example: '3800.0000' })
  totalAmount!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ type: [ProcurementQuoteItemResponseDto] })
  items?: ProcurementQuoteItemResponseDto[];
}
