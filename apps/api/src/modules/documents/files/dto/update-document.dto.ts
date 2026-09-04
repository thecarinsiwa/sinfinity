import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  DOCUMENT_STATUSES,
  type DocumentStatus,
} from './document-response.dto';

const UPDATABLE_STATUSES = ['active', 'archived'] as const;

export class UpdateDocumentDto {
  @ApiPropertyOptional({ example: 'Signed quotation (final)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    enum: UPDATABLE_STATUSES,
    description: 'Use DELETE to soft-delete (status=deleted)',
  })
  @IsOptional()
  @IsIn(UPDATABLE_STATUSES)
  status?: Exclude<DocumentStatus, 'deleted'>;
}
