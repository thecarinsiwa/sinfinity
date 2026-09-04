import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerResponseDto } from '../../customers/dto/customer-response.dto';
import { LEAD_STATUSES, type LeadStatus } from './create-lead.dto';

export class LeadResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiPropertyOptional({ nullable: true })
  sourceId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  companyName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  contactName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiProperty({ enum: LEAD_STATUSES })
  status!: LeadStatus;

  @ApiPropertyOptional({ nullable: true })
  ownerUserId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: '15000.0000',
    description: 'Decimal string',
  })
  estimatedValue!: string | null;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  convertedCustomerId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ConvertLeadResponseDto {
  @ApiProperty({ type: LeadResponseDto })
  lead!: LeadResponseDto;

  @ApiProperty({ type: CustomerResponseDto })
  customer!: CustomerResponseDto;
}
