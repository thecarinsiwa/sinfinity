import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { CLAIM_STATUSES, type ClaimStatus } from '../../claim-statuses';
import {
  WARRANTY_STATUSES,
  WARRANTY_TYPES,
  type WarrantyStatus,
  type WarrantyType,
} from '../../warranty-statuses';

export class CreateWarrantyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty()
  @IsUUID('all')
  productId!: string;

  @ApiProperty()
  @IsUUID('all')
  customerId!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  serialNumberId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Must match org and customer when set',
  })
  @IsOptional()
  @IsUUID('all')
  salesOrderId?: string | null;

  @ApiProperty({ example: '2026-01-15', description: 'ISO date YYYY-MM-DD' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: '2027-01-15', nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiPropertyOptional({ enum: WARRANTY_TYPES, default: 'seller' })
  @IsOptional()
  @IsIn([...WARRANTY_TYPES])
  warrantyType?: WarrantyType;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  terms?: string | null;
}

export class UpdateWarrantyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  customerId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  serialNumberId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  salesOrderId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiPropertyOptional({ enum: WARRANTY_TYPES })
  @IsOptional()
  @IsIn([...WARRANTY_TYPES])
  warrantyType?: WarrantyType;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  terms?: string | null;
}

export class TransitionWarrantyDto {
  @ApiProperty({ enum: WARRANTY_STATUSES })
  @IsIn([...WARRANTY_STATUSES])
  toStatus!: WarrantyStatus;
}

export class WarrantyResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiPropertyOptional({ nullable: true })
  productId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  serialNumberId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  customerId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  salesOrderId!: string | null;

  @ApiProperty()
  startDate!: string;

  @ApiPropertyOptional({ nullable: true })
  endDate!: string | null;

  @ApiProperty({ enum: WARRANTY_TYPES })
  warrantyType!: WarrantyType;

  @ApiPropertyOptional({ nullable: true })
  terms!: string | null;

  @ApiProperty({ enum: WARRANTY_STATUSES })
  status!: WarrantyStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ type: () => [WarrantyClaimResponseDto] })
  claims?: WarrantyClaimResponseDto[];
}

export class CreateWarrantyClaimDto {
  @ApiProperty({ example: 'CLM-2026-001' })
  @IsString()
  @MaxLength(64)
  claimNumber!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  ticketId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  claimedAt?: string | null;
}

export class UpdateWarrantyClaimDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  ticketId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  resolution?: string | null;
}

export class TransitionWarrantyClaimDto {
  @ApiProperty({ enum: CLAIM_STATUSES })
  @IsIn([...CLAIM_STATUSES])
  toStatus!: ClaimStatus;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Optional resolution notes when approving/rejecting/fulfilling',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  resolution?: string | null;
}

export class WarrantyClaimResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  warrantyId!: string;

  @ApiPropertyOptional({ nullable: true })
  ticketId!: string | null;

  @ApiProperty()
  claimNumber!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: CLAIM_STATUSES })
  status!: ClaimStatus;

  @ApiPropertyOptional({ nullable: true })
  resolution!: string | null;

  @ApiProperty()
  claimedAt!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ListWarrantiesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ enum: WARRANTY_STATUSES })
  @IsOptional()
  @IsIn([...WARRANTY_STATUSES])
  status?: WarrantyStatus;

  @ApiPropertyOptional({ enum: WARRANTY_TYPES })
  @IsOptional()
  @IsIn([...WARRANTY_TYPES])
  warrantyType?: WarrantyType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  serialNumberId?: string;
}
