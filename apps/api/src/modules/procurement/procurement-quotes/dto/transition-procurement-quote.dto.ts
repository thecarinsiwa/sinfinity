import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  PROCUREMENT_QUOTE_STATUSES,
  type ProcurementQuoteStatus,
} from '../procurement-quote-statuses';

export class TransitionProcurementQuoteDto {
  @ApiProperty({ enum: PROCUREMENT_QUOTE_STATUSES })
  @IsIn(PROCUREMENT_QUOTE_STATUSES)
  toStatus!: ProcurementQuoteStatus;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}
