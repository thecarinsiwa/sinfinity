import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  CreateCustomerAddressDto,
  CreateCustomerContactDto,
  CreateCustomerNoteDto,
} from './customer-nested.dto';

export const CUSTOMER_TYPES = ['individual', 'organization'] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export const CUSTOMER_STATUSES = ['active', 'inactive', 'blocked'] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export class CreateCustomerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'CUST-001' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'Acme SA' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    enum: CUSTOMER_TYPES,
    default: 'organization',
  })
  @IsOptional()
  @IsIn(CUSTOMER_TYPES)
  type?: CustomerType;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  taxId?: string | null;

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
  @IsUUID('all')
  categoryId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  ownerUserId?: string | null;

  @ApiPropertyOptional({
    enum: CUSTOMER_STATUSES,
    default: 'active',
  })
  @IsOptional()
  @IsIn(CUSTOMER_STATUSES)
  status?: CustomerStatus;

  @ApiPropertyOptional({ type: [CreateCustomerContactDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerContactDto)
  contacts?: CreateCustomerContactDto[];

  @ApiPropertyOptional({ type: [CreateCustomerAddressDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerAddressDto)
  addresses?: CreateCustomerAddressDto[];

  @ApiPropertyOptional({ type: [CreateCustomerNoteDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerNoteDto)
  notes?: CreateCustomerNoteDto[];
}
