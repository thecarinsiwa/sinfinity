import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  CONTRACT_STATUSES,
  CreateContractItemDto,
  type ContractStatus,
} from './contract-item.dto';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export class CreateContractDto {
  @ApiPropertyOptional({
    description:
      'Defaults to the authenticated organization. Super-admin may set explicitly.',
  })
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'CTR-2026-001' })
  @IsString()
  @MaxLength(64)
  contractNumber!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Customer party (at least one of customerId / supplierId)',
  })
  @IsOptional()
  @IsUUID('all')
  customerId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Supplier party (at least one of customerId / supplierId)',
  })
  @IsOptional()
  @IsUUID('all')
  supplierId?: string | null;

  @ApiProperty({ example: 'Framework agreement — Kinshasa depot' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: '2026-01-01', nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional({ example: '2026-12-31', nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiPropertyOptional({
    enum: CONTRACT_STATUSES,
    default: 'draft',
  })
  @IsOptional()
  @IsIn(CONTRACT_STATUSES)
  status?: ContractStatus;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Signed PDF document id (same organization)',
  })
  @IsOptional()
  @IsUUID('all')
  documentId?: string | null;

  @ApiPropertyOptional({
    example: '50000.0000',
    description: 'Total value as decimal string',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Matches(DECIMAL_REGEX, { message: 'totalValue must be a decimal string' })
  totalValue?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({
    type: [CreateContractItemDto],
    description: 'Optional line items created with the contract',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CreateContractItemDto)
  items?: CreateContractItemDto[];
}
