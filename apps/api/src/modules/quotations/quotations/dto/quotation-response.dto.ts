import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuotationStatusResponseDto } from '../../quotation-statuses/dto/quotation-status-response.dto';
import { QuotationItemResponseDto } from './quotation-item.dto';
import { QuotationTermsResponseDto } from './quotation-terms.dto';

export class QuotationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ example: 'Q-2026-001' })
  quoteNumber!: string;

  @ApiProperty()
  customerId!: string;

  @ApiPropertyOptional({ nullable: true })
  opportunityId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  statusId!: string | null;

  @ApiPropertyOptional({ type: QuotationStatusResponseDto })
  status?: QuotationStatusResponseDto;

  @ApiProperty({ example: 1 })
  version!: number;

  @ApiPropertyOptional({ nullable: true, example: '2026-09-04' })
  issueDate!: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2026-10-04' })
  validUntil!: string | null;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiPropertyOptional({ nullable: true, example: '1.00000000' })
  exchangeRate!: string | null;

  @ApiProperty({ example: '0.0000', description: 'Decimal string HT' })
  subtotal!: string;

  @ApiProperty({ example: '0.0000', description: 'Decimal string' })
  taxAmount!: string;

  @ApiProperty({ example: '0.0000', description: 'Decimal string TTC' })
  totalAmount!: string;

  @ApiPropertyOptional({ nullable: true })
  ownerUserId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ type: [QuotationItemResponseDto] })
  items?: QuotationItemResponseDto[];

  @ApiPropertyOptional({ type: QuotationTermsResponseDto, nullable: true })
  terms?: QuotationTermsResponseDto | null;
}
