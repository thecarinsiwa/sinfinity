import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TAX_TYPES, type TaxType } from './create-tax.dto';

export class TaxResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  organizationId!: string | null;

  @ApiProperty({ example: 'TVA16' })
  code!: string;

  @ApiProperty({ example: 'TVA RDC 16%' })
  name!: string;

  @ApiProperty({
    example: '16.0000',
    description: 'Decimal string (never float)',
  })
  rate!: string;

  @ApiProperty({ enum: TAX_TYPES, example: 'vat' })
  taxType!: TaxType;

  @ApiPropertyOptional({ nullable: true })
  countryId!: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
