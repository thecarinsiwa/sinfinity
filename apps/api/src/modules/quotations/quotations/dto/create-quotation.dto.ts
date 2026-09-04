import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateQuotationItemDto } from './quotation-item.dto';
import { UpsertQuotationTermsDto } from './quotation-terms.dto';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateQuotationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'Q-2026-001' })
  @IsString()
  @MaxLength(64)
  quoteNumber!: string;

  @ApiProperty()
  @IsUUID('all')
  customerId!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  opportunityId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: '2026-09-04',
    description: 'ISO date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  issueDate?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: '2026-10-04',
    description: 'ISO date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: '1.00000000',
    description: 'Decimal string; frozen on send (Lot 3)',
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'exchangeRate must be a decimal string' })
  exchangeRate?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  ownerUserId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({ type: [CreateQuotationItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  items?: CreateQuotationItemDto[];

  @ApiPropertyOptional({ type: UpsertQuotationTermsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpsertQuotationTermsDto)
  terms?: UpsertQuotationTermsDto;
}
