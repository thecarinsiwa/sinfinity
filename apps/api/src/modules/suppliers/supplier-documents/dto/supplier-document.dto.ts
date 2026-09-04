import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateSupplierDocumentDto {
  @ApiProperty()
  @IsUUID('all')
  documentId!: string;

  @ApiPropertyOptional({ example: 'certificate', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  docKind?: string | null;

  @ApiPropertyOptional({
    example: '2027-12-31',
    description: 'ISO date (YYYY-MM-DD)',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}

export class UpdateSupplierDocumentDto {
  @ApiPropertyOptional({ example: 'certificate', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  docKind?: string | null;

  @ApiPropertyOptional({
    example: '2027-12-31',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}

export class SupplierDocumentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  supplierId!: string;

  @ApiProperty()
  documentId!: string;

  @ApiPropertyOptional({ nullable: true })
  docKind!: string | null;

  @ApiPropertyOptional({ nullable: true, example: '2027-12-31' })
  expiresAt!: string | null;

  @ApiProperty()
  createdAt!: string;
}
