import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
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
  DELIVERY_STATUSES,
  type DeliveryStatus,
} from '../../delivery-statuses';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateDeliveryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'DLV-2026-001' })
  @IsString()
  @MaxLength(64)
  deliveryNumber!: string;

  @ApiProperty()
  @IsUUID('all')
  salesOrderId!: string;

  @ApiProperty({
    description: 'Must match the sales order customer',
  })
  @IsUUID('all')
  customerId!: string;

  @ApiProperty()
  @IsUUID('all')
  warehouseId!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  deliveryAddressId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  driverUserId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}

export class UpdateDeliveryDto {
  @ApiPropertyOptional({ example: 'DLV-2026-001' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  deliveryNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  warehouseId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  deliveryAddressId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  driverUserId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}

export class DeliveryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ example: 'DLV-2026-001' })
  deliveryNumber!: string;

  @ApiPropertyOptional({ nullable: true })
  salesOrderId!: string | null;

  @ApiProperty()
  customerId!: string;

  @ApiPropertyOptional({ nullable: true })
  warehouseId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  deliveryAddressId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  scheduledAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  deliveredAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  driverUserId!: string | null;

  @ApiProperty({ enum: DELIVERY_STATUSES })
  status!: DeliveryStatus;

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

  @ApiPropertyOptional({ type: () => [DeliveryItemResponseDto] })
  items?: DeliveryItemResponseDto[];
}

export class CreateDeliveryItemDto {
  @ApiProperty()
  @IsUUID('all')
  salesOrderItemId!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Defaults to the sales order item product',
  })
  @IsOptional()
  @IsUUID('all')
  productId?: string | null;

  @ApiProperty({ example: '2.0000' })
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity!: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Serial UUIDs when product is serialized',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  serialNumberIds?: string[];
}

export class UpdateDeliveryItemDto {
  @ApiPropertyOptional({ example: '2.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'quantity must be a decimal string' })
  quantity?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  serialNumberIds?: string[] | null;
}

export class DeliveryItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  deliveryId!: string;

  @ApiPropertyOptional({ nullable: true })
  salesOrderItemId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  productId!: string | null;

  @ApiProperty({ example: '2.0000' })
  quantity!: string;

  @ApiPropertyOptional({ type: [String], nullable: true })
  serialNumberIds!: string[] | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ListDeliveriesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'DLV-2026' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: DELIVERY_STATUSES })
  @IsOptional()
  @IsIn([...DELIVERY_STATUSES])
  status?: DeliveryStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  salesOrderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  warehouseId?: string;
}

export class CreateDeliveryTrackingDto {
  @ApiProperty({
    example: 'en_route',
    description: 'Free-form step status (e.g. departed, en_route, arrived)',
  })
  @IsString()
  @MaxLength(64)
  status!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: '-4.3276000',
    description: 'Decimal degrees',
  })
  @IsOptional()
  @Matches(/^-?\d+(\.\d+)?$/, { message: 'latitude must be a decimal string' })
  latitude?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: '15.3133000',
    description: 'Decimal degrees',
  })
  @IsOptional()
  @Matches(/^-?\d+(\.\d+)?$/, { message: 'longitude must be a decimal string' })
  longitude?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Gombe, Kinshasa' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  locationLabel?: string | null;

  @ApiPropertyOptional({
    description: 'Defaults to now',
    example: '2026-09-09T14:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  recordedAt?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}

export class DeliveryTrackingResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  deliveryId!: string;

  @ApiProperty({ example: 'en_route' })
  status!: string;

  @ApiPropertyOptional({ nullable: true, example: '-4.3276000' })
  latitude!: string | null;

  @ApiPropertyOptional({ nullable: true, example: '15.3133000' })
  longitude!: string | null;

  @ApiPropertyOptional({ nullable: true })
  locationLabel!: string | null;

  @ApiProperty()
  recordedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;
}

export const DELIVERY_CONFIRMATION_STATUSES = [
  'accepted',
  'accepted_with_remarks',
  'rejected',
] as const;
export type DeliveryConfirmationStatus =
  (typeof DELIVERY_CONFIRMATION_STATUSES)[number];

export const PROOF_OF_DELIVERY_TYPES = [
  'signature',
  'photo',
  'document',
] as const;
export type ProofOfDeliveryType = (typeof PROOF_OF_DELIVERY_TYPES)[number];

export class CreateProofOfDeliveryDto {
  @ApiProperty()
  @IsUUID('all')
  documentId!: string;

  @ApiProperty({ enum: PROOF_OF_DELIVERY_TYPES, example: 'signature' })
  @IsIn([...PROOF_OF_DELIVERY_TYPES])
  proofType!: ProofOfDeliveryType;

  @ApiPropertyOptional({
    nullable: true,
    example: '2026-09-09T15:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  capturedAt?: string | null;
}

export class CreateDeliveryConfirmationDto {
  @ApiPropertyOptional({ nullable: true, example: 'Jean Mbala' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  confirmedByName?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Defaults to now',
    example: '2026-09-09T15:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  confirmedAt?: string | null;

  @ApiProperty({
    enum: DELIVERY_CONFIRMATION_STATUSES,
    example: 'accepted',
  })
  @IsIn([...DELIVERY_CONFIRMATION_STATUSES])
  status!: DeliveryConfirmationStatus;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Required when status is accepted_with_remarks',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  remarks?: string | null;

  @ApiPropertyOptional({
    type: [CreateProofOfDeliveryDto],
    description: 'Optional signature/photo/document proofs',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProofOfDeliveryDto)
  proofs?: CreateProofOfDeliveryDto[];
}

export class ProofOfDeliveryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  deliveryId!: string;

  @ApiPropertyOptional({ nullable: true })
  confirmationId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  documentId!: string | null;

  @ApiProperty({ enum: PROOF_OF_DELIVERY_TYPES })
  proofType!: ProofOfDeliveryType;

  @ApiPropertyOptional({ nullable: true })
  capturedAt!: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class DeliveryConfirmationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  deliveryId!: string;

  @ApiPropertyOptional({ nullable: true })
  confirmedByName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  confirmedAt!: string | null;

  @ApiProperty({ enum: DELIVERY_CONFIRMATION_STATUSES })
  status!: DeliveryConfirmationStatus;

  @ApiPropertyOptional({ nullable: true })
  remarks!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ type: [ProofOfDeliveryResponseDto] })
  proofs?: ProofOfDeliveryResponseDto[];
}
