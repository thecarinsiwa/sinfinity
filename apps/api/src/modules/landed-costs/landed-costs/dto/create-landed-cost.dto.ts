import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateLandedCostItemDto } from './landed-cost-item.dto';

export class CreateLandedCostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'LC-2026-001' })
  @IsString()
  @MaxLength(64)
  reference!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Linked purchase order (at least one of PO or shipment)',
  })
  @IsOptional()
  @IsUUID('all')
  purchaseOrderId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Linked shipment (at least one of PO or shipment)',
  })
  @IsOptional()
  @IsUUID('all')
  shipmentId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Calculation currency (USD/CDF)',
  })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ type: [CreateLandedCostItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CreateLandedCostItemDto)
  items?: CreateLandedCostItemDto[];
}
