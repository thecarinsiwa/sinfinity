import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  PAYMENT_STATUSES,
  type PaymentStatus,
} from '../../payment-statuses';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreatePaymentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty()
  @IsUUID('all')
  customerId!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'When set, confirm applies amount to this invoice + AR',
  })
  @IsOptional()
  @IsUUID('all')
  invoiceId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  paymentMethodId?: string | null;

  @ApiProperty({ example: '500.0000' })
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiProperty({
    example: '2026-04-15T10:30:00.000Z',
    description: 'ISO datetime',
  })
  @IsDateString()
  paidAt!: string;

  @ApiPropertyOptional({ nullable: true, example: 'MM-REF-123' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  reference?: string | null;

  @ApiPropertyOptional({
    default: false,
    description: 'If true, create as confirmed and apply invoice/AR immediately',
  })
  @IsOptional()
  @IsBoolean()
  confirmImmediately?: boolean;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Optional sales_order_payments row to link (same org/customer)',
  })
  @IsOptional()
  @IsUUID('all')
  salesOrderPaymentId?: string | null;
}

export class UpdatePaymentDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  invoiceId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  paymentMethodId?: string | null;

  @ApiPropertyOptional({ example: '500.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  reference?: string | null;
}

export class ConfirmPaymentDto {
  @ApiPropertyOptional({
    nullable: true,
    description: 'Link sales_order_payments.payment_id on confirm',
  })
  @IsOptional()
  @IsUUID('all')
  salesOrderPaymentId?: string | null;
}

export class ListPaymentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ enum: PAYMENT_STATUSES })
  @IsOptional()
  @IsIn([...PAYMENT_STATUSES])
  status?: PaymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  invoiceId?: string;

  @ApiPropertyOptional({ example: 'MM-REF' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  search?: string;
}

export class PaymentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  customerId!: string;

  @ApiPropertyOptional({ nullable: true })
  invoiceId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  paymentMethodId!: string | null;

  @ApiProperty({ example: '500.0000' })
  amount!: string;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiProperty()
  paidAt!: string;

  @ApiPropertyOptional({ nullable: true })
  reference!: string | null;

  @ApiProperty({ enum: PAYMENT_STATUSES })
  status!: PaymentStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
