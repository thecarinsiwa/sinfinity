import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  SERVICE_BILLING_TYPES,
  type ServiceBillingType,
} from './service-response.dto';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateServiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'INST-SW' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'Switch installation' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  categoryId?: string | null;

  @ApiPropertyOptional({
    example: '150.0000',
    default: '0.0000',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'basePrice must be a decimal string' })
  basePrice?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({
    enum: SERVICE_BILLING_TYPES,
    default: 'fixed',
  })
  @IsOptional()
  @IsIn(SERVICE_BILLING_TYPES)
  billingType?: ServiceBillingType;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
