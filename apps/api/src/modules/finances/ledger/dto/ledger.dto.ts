import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { AGING_BUCKETS, type AgingBucket } from '../../aging-buckets';
import { AP_STATUSES, type ApStatus } from '../../ap-statuses';
import { AR_STATUSES, type ArStatus } from '../../ar-statuses';

export class ListAccountsReceivableQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  customerId?: string;

  @ApiPropertyOptional({ enum: AR_STATUSES })
  @IsOptional()
  @IsIn([...AR_STATUSES])
  status?: ArStatus;

  @ApiPropertyOptional({
    default: false,
    description: 'Only open|partial',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  openOnly?: boolean;
}

export class ListAccountsPayableQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  supplierId?: string;

  @ApiPropertyOptional({ enum: AP_STATUSES })
  @IsOptional()
  @IsIn([...AP_STATUSES])
  status?: ApStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  openOnly?: boolean;
}

export class AccountsReceivableResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  customerId!: string;

  @ApiProperty()
  invoiceId!: string;

  @ApiProperty()
  originalAmount!: string;

  @ApiProperty()
  balanceDue!: string;

  @ApiPropertyOptional({ nullable: true })
  dueDate!: string | null;

  @ApiPropertyOptional({ enum: AGING_BUCKETS, nullable: true })
  agingBucket!: AgingBucket | null;

  @ApiProperty({ enum: AR_STATUSES })
  status!: ArStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class AccountsPayableResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  supplierId!: string;

  @ApiPropertyOptional({ nullable: true })
  purchaseOrderId!: string | null;

  @ApiProperty()
  originalAmount!: string;

  @ApiProperty()
  balanceDue!: string;

  @ApiPropertyOptional({ nullable: true })
  dueDate!: string | null;

  @ApiPropertyOptional({
    enum: AGING_BUCKETS,
    nullable: true,
    description: 'Computed from dueDate (not stored on AP)',
  })
  agingBucket!: AgingBucket | null;

  @ApiProperty({ enum: AP_STATUSES })
  status!: ApStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class AgeingBucketResponseDto {
  @ApiProperty({ enum: AGING_BUCKETS })
  bucket!: AgingBucket;

  @ApiProperty()
  count!: number;

  @ApiProperty({ example: '1500.0000' })
  balanceDue!: string;
}
