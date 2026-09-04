import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SUPPLIER_STATUSES,
  type SupplierStatus,
} from './create-supplier.dto';
import {
  SupplierAddressResponseDto,
  SupplierContactResponseDto,
  SupplierPaymentTermResponseDto,
} from './supplier-nested.dto';

export class SupplierResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ example: 'SUP-CN-001' })
  code!: string;

  @ApiProperty({ example: 'Shenzhen Tech Co.' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  categoryId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  countryId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ nullable: true })
  website!: string | null;

  @ApiPropertyOptional({ nullable: true })
  taxId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: '4.50',
    description: 'Decimal string',
  })
  rating!: string | null;

  @ApiProperty({ enum: SUPPLIER_STATUSES })
  status!: SupplierStatus;

  @ApiProperty()
  preferred!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({
    type: [SupplierContactResponseDto],
    description: 'Present on get-by-id and create',
  })
  contacts?: SupplierContactResponseDto[];

  @ApiPropertyOptional({
    type: [SupplierAddressResponseDto],
    description: 'Present on get-by-id and create',
  })
  addresses?: SupplierAddressResponseDto[];

  @ApiPropertyOptional({
    type: [SupplierPaymentTermResponseDto],
    description: 'Present on get-by-id and create',
  })
  paymentTerms?: SupplierPaymentTermResponseDto[];
}
