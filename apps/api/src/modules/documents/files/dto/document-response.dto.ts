import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const DOCUMENT_STATUSES = ['active', 'archived', 'deleted'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export class DocumentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiPropertyOptional({ nullable: true })
  documentTypeId!: string | null;

  @ApiProperty({ example: 'Signed quotation' })
  title!: string;

  @ApiProperty({ example: 'quote.pdf' })
  fileName!: string;

  @ApiProperty({
    description: 'Storage object key (not a public URL)',
    example: 'org-id/2026/09/uuid-quote.pdf',
  })
  fileUrl!: string;

  @ApiPropertyOptional({ nullable: true, example: 'application/pdf' })
  mimeType!: string | null;

  @ApiPropertyOptional({ nullable: true, example: 102400 })
  fileSize!: number | null;

  @ApiPropertyOptional({ nullable: true })
  uploadedBy!: string | null;

  @ApiPropertyOptional({ nullable: true })
  checksum!: string | null;

  @ApiProperty({ enum: DOCUMENT_STATUSES })
  status!: DocumentStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class DocumentVersionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  documentId!: string;

  @ApiProperty({ example: 1 })
  versionNumber!: number;

  @ApiProperty()
  fileUrl!: string;

  @ApiPropertyOptional({ nullable: true })
  changeNotes!: string | null;

  @ApiPropertyOptional({ nullable: true })
  createdBy!: string | null;

  @ApiProperty()
  createdAt!: string;
}
