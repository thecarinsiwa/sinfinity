import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export const PROCUREMENT_APPROVAL_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const;
export type ProcurementApprovalStatus =
  (typeof PROCUREMENT_APPROVAL_STATUSES)[number];

export class CreateProcurementApprovalDto {
  @ApiProperty({ enum: PROCUREMENT_APPROVAL_STATUSES, default: 'pending' })
  @IsIn(PROCUREMENT_APPROVAL_STATUSES)
  status!: ProcurementApprovalStatus;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Optional quote being approved/rejected',
  })
  @IsOptional()
  @IsUUID('all')
  procurementQuoteId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  comments?: string | null;
}

export class ProcurementApprovalResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  procurementRequestId!: string;

  @ApiPropertyOptional({ nullable: true })
  procurementQuoteId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  approverId!: string | null;

  @ApiProperty({ enum: PROCUREMENT_APPROVAL_STATUSES })
  status!: ProcurementApprovalStatus;

  @ApiPropertyOptional({ nullable: true })
  decisionAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  comments!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
