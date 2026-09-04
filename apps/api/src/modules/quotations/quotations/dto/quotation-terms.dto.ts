import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class UpsertQuotationTermsDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  paymentTermId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  shippingTermId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  warrantyText?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 14 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  deliveryLeadTimeDays?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  additionalTerms?: string | null;
}

export class QuotationTermsResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  quotationId!: string;

  @ApiPropertyOptional({ nullable: true })
  paymentTermId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  shippingTermId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  warrantyText!: string | null;

  @ApiPropertyOptional({ nullable: true })
  deliveryLeadTimeDays!: number | null;

  @ApiPropertyOptional({ nullable: true })
  additionalTerms!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
