import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export const PURCHASE_RECEIPT_STATUSES = ['draft', 'confirmed'] as const;
export type PurchaseReceiptStatus = (typeof PURCHASE_RECEIPT_STATUSES)[number];

export class CreatePurchaseReceiptDto {
  @ApiPropertyOptional({
    description: 'Required for super-admin creating into another org',
  })
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty()
  @IsUUID('all')
  purchaseOrderId!: string;

  @ApiProperty({ example: 'BR-2026-001' })
  @IsString()
  @MaxLength(64)
  receiptNumber!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  warehouseId?: string | null;

  @ApiPropertyOptional({
    example: '2026-09-04T10:00:00.000Z',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  receivedAt?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Optional shipment link (Phase 11)',
  })
  @IsOptional()
  @IsUUID('all')
  shipmentId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}

export class UpdatePurchaseReceiptDto {
  @ApiPropertyOptional({ example: 'BR-2026-001' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  receiptNumber?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  warehouseId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  receivedAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  shipmentId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}

export class ConfirmPurchaseReceiptLineDto {
  @ApiProperty()
  @IsUUID('all')
  purchaseOrderItemId!: string;

  @ApiProperty({ example: '2.0000', description: 'Qty received on this confirm' })
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity!: string;
}

export class ConfirmPurchaseReceiptDto {
  @ApiProperty({ type: [ConfirmPurchaseReceiptLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ConfirmPurchaseReceiptLineDto)
  lines!: ConfirmPurchaseReceiptLineDto[];
}

export class PurchaseReceiptResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  purchaseOrderId!: string;

  @ApiProperty()
  receiptNumber!: string;

  @ApiPropertyOptional({ nullable: true })
  warehouseId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  receivedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  receivedBy!: string | null;

  @ApiPropertyOptional({ nullable: true })
  shipmentId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty({ enum: PURCHASE_RECEIPT_STATUSES })
  status!: PurchaseReceiptStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
