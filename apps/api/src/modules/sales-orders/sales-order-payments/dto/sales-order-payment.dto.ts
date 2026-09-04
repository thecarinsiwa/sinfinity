import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export const SALES_ORDER_PAYMENT_TYPES = [
  'deposit',
  'partial',
  'balance',
] as const;
export type SalesOrderPaymentType =
  (typeof SALES_ORDER_PAYMENT_TYPES)[number];

export class CreateSalesOrderPaymentDto {
  @ApiProperty({ enum: SALES_ORDER_PAYMENT_TYPES, default: 'partial' })
  @IsOptional()
  @IsIn(SALES_ORDER_PAYMENT_TYPES)
  paymentType?: SalesOrderPaymentType;

  @ApiProperty({ example: '500.0000', description: 'Decimal string' })
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Optional link to finances.payments (nullable until Phase 17)',
  })
  @IsOptional()
  @IsUUID('all')
  paymentId?: string | null;

  @ApiPropertyOptional({
    example: '2026-09-04T10:00:00.000Z',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  paidAt?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'MM-REF-001' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  reference?: string | null;
}

export class UpdateSalesOrderPaymentDto {
  @ApiPropertyOptional({ enum: SALES_ORDER_PAYMENT_TYPES })
  @IsOptional()
  @IsIn(SALES_ORDER_PAYMENT_TYPES)
  paymentType?: SalesOrderPaymentType;

  @ApiPropertyOptional({ example: '500.0000' })
  @IsOptional()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  paymentId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  paidAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  reference?: string | null;
}

export class SalesOrderPaymentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  salesOrderId!: string;

  @ApiPropertyOptional({ nullable: true })
  paymentId!: string | null;

  @ApiProperty({ enum: SALES_ORDER_PAYMENT_TYPES })
  paymentType!: SalesOrderPaymentType;

  @ApiProperty({ example: '500.0000' })
  amount!: string;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  paidAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  reference!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
