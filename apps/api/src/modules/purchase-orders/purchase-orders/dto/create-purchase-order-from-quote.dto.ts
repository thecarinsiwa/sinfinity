import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePurchaseOrderFromQuoteDto {
  @ApiProperty()
  @IsUUID('all')
  procurementQuoteId!: string;

  @ApiProperty({ example: 'PO-2026-001' })
  @IsString()
  @MaxLength(64)
  poNumber!: string;

  @ApiPropertyOptional({ example: '2026-09-04' })
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional({ nullable: true, example: '2026-10-01' })
  @IsOptional()
  @IsDateString()
  expectedDate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  paymentTermId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  buyerUserId?: string | null;
}
