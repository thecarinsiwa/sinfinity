import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  REFUND_STATUSES,
  type RefundStatus,
} from '../../refund-statuses';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateRefundDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty()
  @IsUUID('all')
  invoiceId!: string;

  @ApiProperty({
    description: 'Must match the invoice customer',
  })
  @IsUUID('all')
  customerId!: string;

  @ApiProperty({ example: '100.0000' })
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  reason?: string | null;
}

export class UpdateRefundDto {
  @ApiPropertyOptional({ example: '100.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  reason?: string | null;
}

export class TransitionRefundDto {
  @ApiProperty({
    enum: REFUND_STATUSES,
    description: 'draft→issued→applied',
  })
  @IsIn([...REFUND_STATUSES])
  toStatus!: RefundStatus;
}

export class ListRefundsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ enum: REFUND_STATUSES })
  @IsOptional()
  @IsIn([...REFUND_STATUSES])
  status?: RefundStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  invoiceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  customerId?: string;
}

export class RefundResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  invoiceId!: string;

  @ApiProperty()
  customerId!: string;

  @ApiProperty({ example: '100.0000' })
  amount!: string;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  reason!: string | null;

  @ApiProperty({ enum: REFUND_STATUSES })
  status!: RefundStatus;

  @ApiPropertyOptional({ nullable: true })
  refundedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
