import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

export const CUSTOMS_DECLARATION_STATUSES = [
  'draft',
  'submitted',
  'cleared',
  'rejected',
] as const;
export type CustomsDeclarationStatus =
  (typeof CUSTOMS_DECLARATION_STATUSES)[number];

export const IMPORT_DOC_KINDS = [
  'bl',
  'awb',
  'certificate_of_origin',
  'packing_list',
  'invoice',
] as const;
export type ImportDocKind = (typeof IMPORT_DOC_KINDS)[number];

export class CreateCustomsDeclarationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  shipmentId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'D-2026-001' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  declarationNumber?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'DDP' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  regime?: string | null;

  @ApiPropertyOptional({ example: '15000.0000', nullable: true })
  @IsOptional()
  @Matches(DECIMAL_REGEX, { message: 'declaredValue must be a decimal string' })
  declaredValue?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({
    enum: CUSTOMS_DECLARATION_STATUSES,
    default: 'draft',
  })
  @IsOptional()
  @IsIn(CUSTOMS_DECLARATION_STATUSES)
  status?: CustomsDeclarationStatus;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  clearedAt?: string | null;
}

export class UpdateCustomsDeclarationDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  shipmentId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  declarationNumber?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  regime?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Matches(DECIMAL_REGEX, { message: 'declaredValue must be a decimal string' })
  declaredValue?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID('all')
  currencyId?: string | null;

  @ApiPropertyOptional({ enum: CUSTOMS_DECLARATION_STATUSES })
  @IsOptional()
  @IsIn(CUSTOMS_DECLARATION_STATUSES)
  status?: CustomsDeclarationStatus;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  clearedAt?: string | null;
}

export class CustomsDeclarationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiPropertyOptional({ nullable: true })
  shipmentId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  declarationNumber!: string | null;

  @ApiPropertyOptional({ nullable: true })
  regime!: string | null;

  @ApiPropertyOptional({ nullable: true })
  declaredValue!: string | null;

  @ApiPropertyOptional({ nullable: true })
  currencyId!: string | null;

  @ApiProperty({ enum: CUSTOMS_DECLARATION_STATUSES })
  status!: CustomsDeclarationStatus;

  @ApiPropertyOptional({ nullable: true })
  clearedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class ListCustomsDeclarationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ example: 'D-2026' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ enum: CUSTOMS_DECLARATION_STATUSES })
  @IsOptional()
  @IsIn(CUSTOMS_DECLARATION_STATUSES)
  status?: CustomsDeclarationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  shipmentId?: string;
}

export class CreateCustomsDocumentDto {
  @ApiProperty()
  @IsUUID('all')
  documentId!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Free-form customs document kind',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  docKind?: string | null;
}

export class UpdateCustomsDocumentDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  docKind?: string | null;
}

export class CustomsDocumentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  customsDeclarationId!: string;

  @ApiProperty()
  documentId!: string;

  @ApiPropertyOptional({ nullable: true })
  docKind!: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class CreateImportDocumentDto {
  @ApiProperty()
  @IsUUID('all')
  documentId!: string;

  @ApiPropertyOptional({
    enum: IMPORT_DOC_KINDS,
    nullable: true,
  })
  @IsOptional()
  @IsIn(IMPORT_DOC_KINDS)
  docKind?: ImportDocKind | null;
}

export class UpdateImportDocumentDto {
  @ApiPropertyOptional({
    enum: IMPORT_DOC_KINDS,
    nullable: true,
  })
  @IsOptional()
  @IsIn(IMPORT_DOC_KINDS)
  docKind?: ImportDocKind | null;
}

export class ImportDocumentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  shipmentId!: string;

  @ApiProperty()
  documentId!: string;

  @ApiPropertyOptional({ enum: IMPORT_DOC_KINDS, nullable: true })
  docKind!: ImportDocKind | null;

  @ApiProperty()
  createdAt!: string;
}
