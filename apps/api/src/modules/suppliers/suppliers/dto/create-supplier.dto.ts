import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  CreateSupplierAddressDto,
  CreateSupplierContactDto,
  CreateSupplierPaymentTermDto,
} from './supplier-nested.dto';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export const SUPPLIER_STATUSES = [
  'active',
  'inactive',
  'blacklisted',
] as const;
export type SupplierStatus = (typeof SUPPLIER_STATUSES)[number];

export class CreateSupplierDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'SUP-CN-001' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'Shenzhen Tech Co.' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  categoryId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  countryId?: string | null;

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

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  taxId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: '4.50',
    description: 'Decimal string',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'rating must be a decimal string' })
  rating?: string | null;

  @ApiPropertyOptional({
    enum: SUPPLIER_STATUSES,
    default: 'active',
  })
  @IsOptional()
  @IsIn(SUPPLIER_STATUSES)
  status?: SupplierStatus;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  preferred?: boolean;

  @ApiPropertyOptional({ type: [CreateSupplierContactDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierContactDto)
  contacts?: CreateSupplierContactDto[];

  @ApiPropertyOptional({ type: [CreateSupplierAddressDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierAddressDto)
  addresses?: CreateSupplierAddressDto[];

  @ApiPropertyOptional({ type: [CreateSupplierPaymentTermDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierPaymentTermDto)
  paymentTerms?: CreateSupplierPaymentTermDto[];
}
