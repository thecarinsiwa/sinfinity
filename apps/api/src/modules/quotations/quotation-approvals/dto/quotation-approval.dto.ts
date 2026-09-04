import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export const QUOTATION_APPROVAL_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const;
export type QuotationApprovalStatus =
  (typeof QUOTATION_APPROVAL_STATUSES)[number];

export class DecisionCommentsDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  comments?: string | null;
}

export class QuotationApprovalResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  quotationId!: string;

  @ApiPropertyOptional({ nullable: true })
  approverId!: string | null;

  @ApiProperty({ enum: QUOTATION_APPROVAL_STATUSES })
  status!: QuotationApprovalStatus;

  @ApiPropertyOptional({ nullable: true })
  decisionAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  comments!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
