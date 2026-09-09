import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreatePurchaseOrderPaymentDto {
  @ApiProperty({ example: '500.0000', description: 'Decimal string' })
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'TT / LC / Mobile Money via settings payment_methods',
  })
  @IsOptional()
  @IsUUID('all')
  paymentMethodId?: string | null;

  @ApiPropertyOptional({
    example: '2026-09-04T10:00:00.000Z',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  paidAt?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'TT-REF-001' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  reference?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}

export class UpdatePurchaseOrderPaymentDto {
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
  paymentMethodId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  paidAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  reference?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}

export class PurchaseOrderPaymentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  purchaseOrderId!: string;

  @ApiProperty({ example: '500.0000' })
  amount!: string;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  paymentMethodId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  paidAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  reference!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
