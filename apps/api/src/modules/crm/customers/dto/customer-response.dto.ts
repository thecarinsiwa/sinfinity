import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CUSTOMER_STATUSES,
  CUSTOMER_TYPES,
  type CustomerStatus,
  type CustomerType,
} from './create-customer.dto';
import {
  CustomerAddressResponseDto,
  CustomerContactResponseDto,
  CustomerNoteResponseDto,
} from './customer-nested.dto';

export class CustomerResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiPropertyOptional({ nullable: true })
  categoryId!: string | null;

  @ApiProperty({ example: 'CUST-001' })
  code!: string;

  @ApiProperty({ enum: CUSTOMER_TYPES })
  type!: CustomerType;

  @ApiProperty({ example: 'Acme SA' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  legalName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  taxId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ nullable: true })
  website!: string | null;

  @ApiPropertyOptional({ nullable: true })
  ownerUserId!: string | null;

  @ApiProperty({ enum: CUSTOMER_STATUSES })
  status!: CustomerStatus;

  @ApiPropertyOptional({ nullable: true })
  convertedFromLeadId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({
    type: [CustomerContactResponseDto],
    description: 'Present on get-by-id and create',
  })
  contacts?: CustomerContactResponseDto[];

  @ApiPropertyOptional({
    type: [CustomerAddressResponseDto],
    description: 'Present on get-by-id and create',
  })
  addresses?: CustomerAddressResponseDto[];

  @ApiPropertyOptional({
    type: [CustomerNoteResponseDto],
    description: 'Present on get-by-id and create',
  })
  notes?: CustomerNoteResponseDto[];
}
