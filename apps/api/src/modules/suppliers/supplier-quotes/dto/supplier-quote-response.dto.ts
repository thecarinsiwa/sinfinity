import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SUPPLIER_QUOTE_STATUSES,
  type SupplierQuoteStatus,
} from '../supplier-quote-statuses';
import { SupplierQuoteItemResponseDto } from './supplier-quote-item.dto';

export class SupplierQuoteResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  supplierId!: string;

  @ApiProperty({ example: 'SQ-2026-001' })
  quoteNumber!: string;

  @ApiProperty({ example: '2026-09-10' })
  quoteDate!: string;

  @ApiPropertyOptional({ nullable: true })
  validUntil!: string | null;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiProperty({ enum: SUPPLIER_QUOTE_STATUSES })
  status!: SupplierQuoteStatus;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  createdBy!: string | null;

  @ApiPropertyOptional({ nullable: true })
  updatedBy!: string | null;

  @ApiPropertyOptional({ type: [SupplierQuoteItemResponseDto] })
  items?: SupplierQuoteItemResponseDto[];
}
