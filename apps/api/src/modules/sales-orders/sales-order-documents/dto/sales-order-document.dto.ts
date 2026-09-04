import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

export const SALES_ORDER_DOC_KINDS = [
  'purchase_order',
  'contract',
  'other',
] as const;
export type SalesOrderDocKind = (typeof SALES_ORDER_DOC_KINDS)[number];

export class CreateSalesOrderDocumentDto {
  @ApiProperty()
  @IsUUID('all')
  documentId!: string;

  @ApiPropertyOptional({
    enum: SALES_ORDER_DOC_KINDS,
    nullable: true,
  })
  @IsOptional()
  @IsIn(SALES_ORDER_DOC_KINDS)
  docKind?: SalesOrderDocKind | null;
}

export class UpdateSalesOrderDocumentDto {
  @ApiPropertyOptional({
    enum: SALES_ORDER_DOC_KINDS,
    nullable: true,
  })
  @IsOptional()
  @IsIn(SALES_ORDER_DOC_KINDS)
  docKind?: SalesOrderDocKind | null;
}

export class SalesOrderDocumentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  salesOrderId!: string;

  @ApiProperty()
  documentId!: string;

  @ApiPropertyOptional({ enum: SALES_ORDER_DOC_KINDS, nullable: true })
  docKind!: SalesOrderDocKind | null;

  @ApiProperty()
  createdAt!: string;
}
