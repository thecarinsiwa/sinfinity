import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Allow, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Multipart fields for POST /documents (file via FileInterceptor). */
export class UploadDocumentDto {
  @ApiProperty({ example: 'Signed quotation Q-2026-001' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({
    description: 'Document type id (system or org-scoped)',
  })
  @IsOptional()
  @IsUUID('all')
  documentTypeId?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File to upload',
  })
  @Allow()
  file!: unknown;
}
