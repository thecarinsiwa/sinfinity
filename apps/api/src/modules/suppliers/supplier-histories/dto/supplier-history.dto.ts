import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export const SUPPLIER_HISTORY_EVENT_TYPES = [
  'quote',
  'po',
  'payment',
  'evaluation',
] as const;

export type SupplierHistoryEventType =
  (typeof SUPPLIER_HISTORY_EVENT_TYPES)[number];

export class CreateSupplierHistoryDto {
  @ApiProperty()
  @IsUUID('all')
  supplierId!: string;

  @ApiProperty({ enum: SUPPLIER_HISTORY_EVENT_TYPES })
  @IsIn(SUPPLIER_HISTORY_EVENT_TYPES)
  eventType!: SupplierHistoryEventType;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  entityType?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  entityId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  summary?: string | null;

  @ApiPropertyOptional({ example: '1200.0000', nullable: true })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({
    example: '2026-09-04T10:00:00.000Z',
    description: 'Defaults to now when omitted',
  })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}

export class ListSupplierHistoriesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  supplierId?: string;

  @ApiPropertyOptional({ enum: SUPPLIER_HISTORY_EVENT_TYPES })
  @IsOptional()
  @IsIn(SUPPLIER_HISTORY_EVENT_TYPES)
  eventType?: SupplierHistoryEventType;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  occurredAtFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  occurredAtTo?: string;
}

export class SupplierHistoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  supplierId!: string;

  @ApiProperty({ enum: SUPPLIER_HISTORY_EVENT_TYPES })
  eventType!: string;

  @ApiPropertyOptional({ nullable: true })
  entityType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  entityId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  summary!: string | null;

  @ApiPropertyOptional({ nullable: true, example: '1200.0000' })
  amount!: string | null;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiProperty()
  occurredAt!: string;
}
