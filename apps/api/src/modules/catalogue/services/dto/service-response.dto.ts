import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const SERVICE_BILLING_TYPES = [
  'fixed',
  'hourly',
  'per_unit',
] as const;

export type ServiceBillingType = (typeof SERVICE_BILLING_TYPES)[number];

export class ServiceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ example: 'INST-SW' })
  code!: string;

  @ApiProperty({ example: 'Switch installation' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  categoryId!: string | null;

  @ApiProperty({
    example: '150.0000',
    description: 'Decimal string',
  })
  basePrice!: string;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiProperty({ enum: SERVICE_BILLING_TYPES, example: 'fixed' })
  billingType!: ServiceBillingType;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
