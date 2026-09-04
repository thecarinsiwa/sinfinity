import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CONTRACT_STATUSES,
  ContractItemResponseDto,
  type ContractStatus,
} from './contract-item.dto';

export class ContractResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ example: 'CTR-2026-001' })
  contractNumber!: string;

  @ApiPropertyOptional({ nullable: true })
  customerId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  supplierId!: string | null;

  @ApiProperty({ example: 'Framework agreement — Kinshasa depot' })
  title!: string;

  @ApiPropertyOptional({ nullable: true, example: '2026-01-01' })
  startDate!: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2026-12-31' })
  endDate!: string | null;

  @ApiProperty({ enum: CONTRACT_STATUSES })
  status!: ContractStatus;

  @ApiPropertyOptional({ nullable: true })
  documentId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Decimal string',
    example: '50000.0000',
  })
  totalValue!: string | null;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({
    type: [ContractItemResponseDto],
    description: 'Present on get-by-id and create; omitted on list',
  })
  items?: ContractItemResponseDto[];
}
