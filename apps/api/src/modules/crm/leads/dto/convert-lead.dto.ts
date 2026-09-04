import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  CUSTOMER_TYPES,
  type CustomerType,
} from '../../customers/dto/create-customer.dto';

export class ConvertLeadDto {
  @ApiPropertyOptional({
    example: 'CUST-LEAD-001',
    description: 'Customer code; generated if omitted',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  customerCode?: string;

  @ApiPropertyOptional({
    enum: CUSTOMER_TYPES,
    default: 'organization',
  })
  @IsOptional()
  @IsIn(CUSTOMER_TYPES)
  customerType?: CustomerType;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  categoryId?: string | null;

  @ApiPropertyOptional({
    description: 'Defaults to companyName or contactName from the lead',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}
