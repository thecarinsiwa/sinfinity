import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
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
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  SHIPMENT_STATUSES,
  SHIPMENT_TRACKING_SOURCES,
  type ShipmentStatus,
  type ShipmentTrackingSource,
} from '../shipment-statuses';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateShipmentItemDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  purchaseOrderItemId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  productId?: string | null;

  @ApiProperty({ example: '1.0000', description: 'Decimal string' })
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity!: string;

  @ApiPropertyOptional({ example: '12.5000', nullable: true })
  @IsOptional()
  @Matches(DECIMAL_REGEX, { message: 'weightKg must be a decimal string' })
  weightKg?: string | null;

  @ApiPropertyOptional({ example: '0.4500', nullable: true })
  @IsOptional()
  @Matches(DECIMAL_REGEX, { message: 'volumeCbm must be a decimal string' })
  volumeCbm?: string | null;
}

export class UpdateShipmentItemDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  purchaseOrderItemId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  productId?: string | null;

  @ApiPropertyOptional({ example: '1.0000' })
  @IsOptional()
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Matches(DECIMAL_REGEX, { message: 'weightKg must be a decimal string' })
  weightKg?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Matches(DECIMAL_REGEX, { message: 'volumeCbm must be a decimal string' })
  volumeCbm?: string | null;
}

export class ShipmentItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  shipmentId!: string;

  @ApiPropertyOptional({ nullable: true })
  purchaseOrderItemId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  productId!: string | null;

  @ApiProperty({ example: '1.0000' })
  quantity!: string;

  @ApiPropertyOptional({ nullable: true })
  weightKg!: string | null;

  @ApiPropertyOptional({ nullable: true })
  volumeCbm!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CreateShipmentTrackingDto {
  @ApiProperty({ example: 'in_transit' })
  @IsString()
  @MaxLength(64)
  status!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string | null;

  @ApiProperty({ example: '2026-09-04T10:00:00.000Z' })
  @IsDateString()
  eventAt!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @ApiPropertyOptional({
    enum: SHIPMENT_TRACKING_SOURCES,
    default: 'manual',
  })
  @IsOptional()
  @IsIn(SHIPMENT_TRACKING_SOURCES)
  source?: ShipmentTrackingSource;
}

export class UpdateShipmentTrackingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  status?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  eventAt?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @ApiPropertyOptional({ enum: SHIPMENT_TRACKING_SOURCES })
  @IsOptional()
  @IsIn(SHIPMENT_TRACKING_SOURCES)
  source?: ShipmentTrackingSource;
}

export class ShipmentTrackingResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  shipmentId!: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional({ nullable: true })
  location!: string | null;

  @ApiProperty()
  eventAt!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: SHIPMENT_TRACKING_SOURCES })
  source!: ShipmentTrackingSource;

  @ApiProperty()
  createdAt!: string;
}

export class CreateShipmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'SHP-2026-001' })
  @IsString()
  @MaxLength(64)
  shipmentNumber!: string;

  @ApiProperty({ description: 'Required purchase order link' })
  @IsUUID('all')
  purchaseOrderId!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  carrierId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  shippingMethodId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  containerNumber?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  blNumber?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  originCountryId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  destinationCountryId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2026-09-10' })
  @IsOptional()
  @IsDateString()
  etd?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2026-10-01' })
  @IsOptional()
  @IsDateString()
  eta?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  atd?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  ata?: string | null;

  @ApiPropertyOptional({ type: [CreateShipmentItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CreateShipmentItemDto)
  items?: CreateShipmentItemDto[];
}

export class UpdateShipmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  shipmentNumber?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  carrierId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  shippingMethodId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  containerNumber?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  blNumber?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  originCountryId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  destinationCountryId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  etd?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  eta?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  atd?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  ata?: string | null;
}

export class TransitionShipmentDto {
  @ApiProperty({ enum: SHIPMENT_STATUSES })
  @IsIn(SHIPMENT_STATUSES)
  toStatus!: ShipmentStatus;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Optional location for auto tracking event',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string | null;
}

export class ShipmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  shipmentNumber!: string;

  @ApiPropertyOptional({ nullable: true })
  purchaseOrderId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  carrierId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  shippingMethodId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  containerNumber!: string | null;

  @ApiPropertyOptional({ nullable: true })
  blNumber!: string | null;

  @ApiPropertyOptional({ nullable: true })
  originCountryId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  destinationCountryId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  etd!: string | null;

  @ApiPropertyOptional({ nullable: true })
  eta!: string | null;

  @ApiPropertyOptional({ nullable: true })
  atd!: string | null;

  @ApiPropertyOptional({ nullable: true })
  ata!: string | null;

  @ApiProperty({ enum: SHIPMENT_STATUSES })
  status!: ShipmentStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ type: [ShipmentItemResponseDto] })
  items?: ShipmentItemResponseDto[];
}

export class ListShipmentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'SHP-2026' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: SHIPMENT_STATUSES })
  @IsOptional()
  @IsIn(SHIPMENT_STATUSES)
  status?: ShipmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  purchaseOrderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  carrierId?: string;
}
