import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  INVOICE_STATUSES,
  type InvoiceStatus,
} from '../../invoice-statuses';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateInvoiceItemDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  productId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  serviceId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Firewall appliance' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: '2.0000', default: '1.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity?: string;

  @ApiPropertyOptional({ example: '1250.0000', default: '0.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'unitPrice must be a decimal string' })
  unitPrice?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  taxId?: string | null;
}

export class UpdateInvoiceItemDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  productId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  serviceId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: '3.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity?: string;

  @ApiPropertyOptional({ example: '1100.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'unitPrice must be a decimal string' })
  unitPrice?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  taxId?: string | null;
}

export class InvoiceItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  invoiceId!: string;

  @ApiPropertyOptional({ nullable: true })
  productId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  serviceId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ example: '2.0000' })
  quantity!: string;

  @ApiProperty({ example: '1250.0000' })
  unitPrice!: string;

  @ApiPropertyOptional({ nullable: true })
  taxId!: string | null;

  @ApiProperty({ example: '2500.0000' })
  lineTotal!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CreateInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'INV-2026-001' })
  @IsString()
  @MaxLength(64)
  invoiceNumber!: string;

  @ApiProperty()
  @IsUUID('all')
  customerId!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Must match org and customer when set',
  })
  @IsOptional()
  @IsUUID('all')
  salesOrderId?: string | null;

  @ApiProperty({
    example: '2026-04-01',
    description: 'ISO date YYYY-MM-DD (required even for draft)',
  })
  @IsDateString()
  issueDate!: string;

  @ApiPropertyOptional({ example: '2026-04-30', nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  notes?: string | null;

  @ApiPropertyOptional({ type: [CreateInvoiceItemDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items?: CreateInvoiceItemDto[];
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ example: 'INV-2026-001' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  invoiceNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  customerId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  salesOrderId?: string | null;

  @ApiPropertyOptional({ example: '2026-04-01' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  notes?: string | null;
}

export class CreateInvoiceFromSalesOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty()
  @IsUUID('all')
  salesOrderId!: string;

  @ApiProperty({ example: 'INV-2026-SO-001' })
  @IsString()
  @MaxLength(64)
  invoiceNumber!: string;

  @ApiPropertyOptional({
    example: '2026-04-01',
    description: 'Defaults to today (UTC) when omitted',
  })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2026-04-30', nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  notes?: string | null;
}

export class TransitionInvoiceDto {
  @ApiProperty({
    enum: INVOICE_STATUSES,
    description:
      'draft→cancelled; issued→partially_paid|paid|overdue|cancelled; etc. Use POST :id/issue for draft→issued.',
  })
  @IsIn([...INVOICE_STATUSES])
  toStatus!: InvoiceStatus;
}

export class IssueInvoiceDto {
  @ApiPropertyOptional({
    example: '2026-04-01',
    description: 'Overrides issueDate when provided',
  })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2026-04-30', nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}

export class ListInvoicesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'INV' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;

  @ApiPropertyOptional({ enum: INVOICE_STATUSES })
  @IsOptional()
  @IsIn([...INVOICE_STATUSES])
  status?: InvoiceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  salesOrderId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeDeleted?: boolean;
}

export class InvoiceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  invoiceNumber!: string;

  @ApiProperty()
  customerId!: string;

  @ApiPropertyOptional({ nullable: true })
  salesOrderId!: string | null;

  @ApiProperty({ example: '2026-04-01' })
  issueDate!: string;

  @ApiPropertyOptional({ nullable: true, example: '2026-04-30' })
  dueDate!: string | null;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiProperty({ example: '2500.0000' })
  subtotal!: string;

  @ApiProperty({ example: '400.0000' })
  taxAmount!: string;

  @ApiProperty({ example: '2900.0000' })
  totalAmount!: string;

  @ApiProperty({ example: '0.0000' })
  amountPaid!: string;

  @ApiProperty({ enum: INVOICE_STATUSES })
  status!: InvoiceStatus;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  createdBy!: string | null;

  @ApiPropertyOptional({ nullable: true })
  updatedBy!: string | null;

  @ApiPropertyOptional({ nullable: true })
  deletedAt!: string | null;

  @ApiPropertyOptional({ type: [InvoiceItemResponseDto] })
  items?: InvoiceItemResponseDto[];
}
