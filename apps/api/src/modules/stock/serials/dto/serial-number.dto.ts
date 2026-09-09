import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  SERIAL_NUMBER_STATUSES,
  type SerialNumberStatus,
} from '../serial-number-statuses';

export class CreateSerialNumberDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty()
  @IsUUID('all')
  productId!: string;

  @ApiProperty({ example: 'SN-ABC-001' })
  @IsString()
  @MaxLength(128)
  serialNumber!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  batchId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  warehouseId?: string | null;

  @ApiPropertyOptional({
    enum: SERIAL_NUMBER_STATUSES,
    default: 'in_stock',
  })
  @IsOptional()
  @IsIn([...SERIAL_NUMBER_STATUSES])
  status?: SerialNumberStatus;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  purchaseOrderItemId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  salesOrderItemId?: string | null;
}

export class UpdateSerialNumberDto {
  @ApiPropertyOptional({ example: 'SN-ABC-001' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  serialNumber?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  batchId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  warehouseId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  purchaseOrderItemId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  salesOrderItemId?: string | null;
}

export class TransitionSerialNumberDto {
  @ApiProperty({ enum: SERIAL_NUMBER_STATUSES })
  @IsIn([...SERIAL_NUMBER_STATUSES])
  toStatus!: SerialNumberStatus;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Optional warehouse when returning to stock',
  })
  @IsOptional()
  @IsUUID('all')
  warehouseId?: string | null;
}

export class SerialNumberResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty({ example: 'SN-ABC-001' })
  serialNumber!: string;

  @ApiPropertyOptional({ nullable: true })
  batchId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  warehouseId!: string | null;

  @ApiProperty({ enum: SERIAL_NUMBER_STATUSES })
  status!: SerialNumberStatus;

  @ApiPropertyOptional({ nullable: true })
  purchaseOrderItemId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  salesOrderItemId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ListSerialNumbersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  batchId?: string;

  @ApiPropertyOptional({ enum: SERIAL_NUMBER_STATUSES })
  @IsOptional()
  @IsIn([...SERIAL_NUMBER_STATUSES])
  status?: SerialNumberStatus;

  @ApiPropertyOptional({ example: 'SN-ABC' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}
