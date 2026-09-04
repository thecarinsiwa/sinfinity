import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export const SUPPLIER_ADDRESS_TYPES = [
  'hq',
  'warehouse',
  'factory',
  'billing',
] as const;
export type SupplierAddressType = (typeof SUPPLIER_ADDRESS_TYPES)[number];

export class CreateSupplierContactDto {
  @ApiProperty({ example: 'Wei' })
  @IsString()
  @MaxLength(128)
  firstName!: string;

  @ApiProperty({ example: 'Zhang' })
  @IsString()
  @MaxLength(128)
  lastName!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  title?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  phone?: string | null;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateSupplierContactDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  lastName?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  title?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  phone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class SupplierContactResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  supplierId!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiPropertyOptional({ nullable: true })
  title!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiProperty()
  isPrimary!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CreateSupplierAddressDto {
  @ApiPropertyOptional({
    enum: SUPPLIER_ADDRESS_TYPES,
    default: 'hq',
  })
  @IsOptional()
  @IsIn(SUPPLIER_ADDRESS_TYPES)
  type?: SupplierAddressType;

  @ApiProperty({ example: '12 Industrial Park Rd' })
  @IsString()
  @MaxLength(255)
  line1!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  line2?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  cityId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  countryId?: string | null;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateSupplierAddressDto {
  @ApiPropertyOptional({ enum: SUPPLIER_ADDRESS_TYPES })
  @IsOptional()
  @IsIn(SUPPLIER_ADDRESS_TYPES)
  type?: SupplierAddressType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  line1?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  line2?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  cityId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  countryId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class SupplierAddressResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  supplierId!: string;

  @ApiProperty({ enum: SUPPLIER_ADDRESS_TYPES })
  type!: SupplierAddressType;

  @ApiProperty()
  line1!: string;

  @ApiPropertyOptional({ nullable: true })
  line2!: string | null;

  @ApiPropertyOptional({ nullable: true })
  cityId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  countryId!: string | null;

  @ApiProperty()
  isDefault!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CreateSupplierPaymentTermDto {
  @ApiProperty()
  @IsUUID('all')
  paymentTermId!: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class UpdateSupplierPaymentTermDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  paymentTermId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class SupplierPaymentTermResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  supplierId!: string;

  @ApiProperty()
  paymentTermId!: string;

  @ApiProperty()
  isDefault!: boolean;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
