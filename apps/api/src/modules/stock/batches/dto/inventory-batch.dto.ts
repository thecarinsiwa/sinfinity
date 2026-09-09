import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class CreateInventoryBatchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty()
  @IsUUID('all')
  productId!: string;

  @ApiProperty({ example: 'LOT-2026-001' })
  @IsString()
  @MaxLength(128)
  batchNumber!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: '2026-01-15',
    description: 'YYYY-MM-DD',
  })
  @IsOptional()
  @IsString()
  @Matches(DATE_REGEX, { message: 'manufacturedAt must be YYYY-MM-DD' })
  manufacturedAt?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: '2027-01-15',
    description: 'YYYY-MM-DD',
  })
  @IsOptional()
  @IsString()
  @Matches(DATE_REGEX, { message: 'expiresAt must be YYYY-MM-DD' })
  expiresAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  supplierId?: string | null;
}

export class UpdateInventoryBatchDto {
  @ApiPropertyOptional({ example: 'LOT-2026-001' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  batchNumber?: string;

  @ApiPropertyOptional({ nullable: true, example: '2026-01-15' })
  @IsOptional()
  @IsString()
  @Matches(DATE_REGEX, { message: 'manufacturedAt must be YYYY-MM-DD' })
  manufacturedAt?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2027-01-15' })
  @IsOptional()
  @IsString()
  @Matches(DATE_REGEX, { message: 'expiresAt must be YYYY-MM-DD' })
  expiresAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  supplierId?: string | null;
}

export class InventoryBatchResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty({ example: 'LOT-2026-001' })
  batchNumber!: string;

  @ApiPropertyOptional({ nullable: true })
  manufacturedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  expiresAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  supplierId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ListInventoryBatchesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  productId?: string;

  @ApiPropertyOptional({ example: 'LOT-2026' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  supplierId?: string;
}
