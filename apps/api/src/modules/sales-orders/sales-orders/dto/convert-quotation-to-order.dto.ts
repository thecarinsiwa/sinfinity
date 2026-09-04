import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class ConvertQuotationToOrderDto {
  @ApiProperty({ example: 'SO-2026-001' })
  @IsString()
  @MaxLength(64)
  orderNumber!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  branchId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  billingAddressId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  shippingAddressId?: string | null;

  @ApiPropertyOptional({
    example: '2026-09-04',
    description: 'Defaults to today UTC',
  })
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  requestedDeliveryDate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  ownerUserId?: string | null;
}
