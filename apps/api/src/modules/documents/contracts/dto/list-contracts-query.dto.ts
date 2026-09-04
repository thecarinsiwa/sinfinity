import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  CONTRACT_STATUSES,
  type ContractStatus,
} from './contract-item.dto';

export class ListContractsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by organization (super-admin). Ignored for org users.',
  })
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ enum: CONTRACT_STATUSES })
  @IsOptional()
  @IsIn(CONTRACT_STATUSES)
  status?: ContractStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  supplierId?: string;

  @ApiPropertyOptional({ example: 'CTR-2026' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}
