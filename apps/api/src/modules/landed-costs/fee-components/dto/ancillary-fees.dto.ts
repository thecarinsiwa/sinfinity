import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateShippingCostDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  shipmentId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  shippingMethodId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  carrierId?: string | null;

  @ApiPropertyOptional({ example: '2500.0000', default: '0.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount?: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Source currency; converted to header currency on calculate',
  })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class UpdateShippingCostDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  shipmentId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  shippingMethodId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  carrierId?: string | null;

  @ApiPropertyOptional({ example: '2500.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class ShippingCostResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  landedCostId!: string;

  @ApiPropertyOptional({ nullable: true })
  shipmentId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  shippingMethodId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  carrierId!: string | null;

  @ApiProperty({ example: '2500.0000' })
  amount!: string;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CreateCustomsCostDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  customsDeclarationId?: string | null;

  @ApiPropertyOptional({ example: '20000.0000', default: '0.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'dutiesAmount must be a decimal string' })
  dutiesAmount?: string;

  @ApiPropertyOptional({ example: '5000.0000', default: '0.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'vatAmount must be a decimal string' })
  vatAmount?: string;

  @ApiPropertyOptional({ example: '2500.0000', default: '0.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'otherFees must be a decimal string' })
  otherFees?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class UpdateCustomsCostDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  customsDeclarationId?: string | null;

  @ApiPropertyOptional({ example: '20000.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'dutiesAmount must be a decimal string' })
  dutiesAmount?: string;

  @ApiPropertyOptional({ example: '5000.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'vatAmount must be a decimal string' })
  vatAmount?: string;

  @ApiPropertyOptional({ example: '2500.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'otherFees must be a decimal string' })
  otherFees?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class CustomsCostResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  landedCostId!: string;

  @ApiPropertyOptional({ nullable: true })
  customsDeclarationId!: string | null;

  @ApiProperty({ example: '20000.0000' })
  dutiesAmount!: string;

  @ApiProperty({ example: '5000.0000' })
  vatAmount!: string;

  @ApiProperty({ example: '2500.0000' })
  otherFees!: string;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CreateLocalTransportCostDto {
  @ApiPropertyOptional({ nullable: true, example: 'Port de Matadi' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fromLocation?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Entrepôt Kinshasa' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  toLocation?: string | null;

  @ApiPropertyOptional({ example: '800.0000', default: '0.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  provider?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class UpdateLocalTransportCostDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fromLocation?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  toLocation?: string | null;

  @ApiPropertyOptional({ example: '800.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  provider?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class LocalTransportCostResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  landedCostId!: string;

  @ApiPropertyOptional({ nullable: true })
  fromLocation!: string | null;

  @ApiPropertyOptional({ nullable: true })
  toLocation!: string | null;

  @ApiProperty({ example: '800.0000' })
  amount!: string;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  provider!: string | null;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export const INSPECTION_PLACES = ['origin', 'destination', 'transit'] as const;
export type InspectionPlace = (typeof INSPECTION_PLACES)[number];

export class CreateInspectionCostDto {
  @ApiPropertyOptional({ enum: INSPECTION_PLACES, default: 'origin' })
  @IsOptional()
  @IsString()
  inspectionPlace?: InspectionPlace;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  inspector?: string | null;

  @ApiPropertyOptional({ example: '350.0000', default: '0.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2026-08-15' })
  @IsOptional()
  @IsString()
  inspectedAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  reportDocumentId?: string | null;
}

export class UpdateInspectionCostDto {
  @ApiPropertyOptional({ enum: INSPECTION_PLACES })
  @IsOptional()
  @IsString()
  inspectionPlace?: InspectionPlace;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  inspector?: string | null;

  @ApiPropertyOptional({ example: '350.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  inspectedAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  reportDocumentId?: string | null;
}

export class InspectionCostResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  landedCostId!: string;

  @ApiProperty({ enum: INSPECTION_PLACES })
  inspectionPlace!: InspectionPlace;

  @ApiPropertyOptional({ nullable: true })
  inspector!: string | null;

  @ApiProperty({ example: '350.0000' })
  amount!: string;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  inspectedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  reportDocumentId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CreateHandlingCostDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string | null;

  @ApiPropertyOptional({ example: '120.0000', default: '0.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class UpdateHandlingCostDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string | null;

  @ApiPropertyOptional({ example: '120.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class HandlingCostResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  landedCostId!: string;

  @ApiPropertyOptional({ nullable: true })
  location!: string | null;

  @ApiProperty({ example: '120.0000' })
  amount!: string;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CreateOtherProcurementCostDto {
  @ApiProperty({
    example: 'insurance',
    description: 'insurance / brokerage / banking / other',
  })
  @IsString()
  @MaxLength(64)
  costType!: string;

  @ApiPropertyOptional({ example: '90.0000', default: '0.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class UpdateOtherProcurementCostDto {
  @ApiPropertyOptional({ example: 'insurance' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  costType?: string;

  @ApiPropertyOptional({ example: '90.0000' })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'amount must be a decimal string' })
  amount?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class OtherProcurementCostResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  landedCostId!: string;

  @ApiProperty({ example: 'insurance' })
  costType!: string;

  @ApiProperty({ example: '90.0000' })
  amount!: string;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
