import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DOCUMENT_LINK_ENTITY_TYPES,
  DOCUMENT_LINK_ROLES,
  type DocumentLinkEntityType,
  type DocumentLinkRole,
} from '../document-links.catalog';
import {
  DOCUMENT_STATUSES,
  type DocumentStatus,
} from '../../files/dto/document-response.dto';

export class DocumentLinkResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  documentId!: string;

  @ApiProperty({ enum: DOCUMENT_LINK_ENTITY_TYPES, example: 'customer' })
  entityType!: DocumentLinkEntityType;

  @ApiProperty()
  entityId!: string;

  @ApiPropertyOptional({
    enum: DOCUMENT_LINK_ROLES,
    nullable: true,
    example: 'attachment',
  })
  role!: DocumentLinkRole | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ example: 'Signed quotation' })
  documentTitle!: string;

  @ApiProperty({ example: 'quote.pdf' })
  documentFileName!: string;

  @ApiProperty({ enum: DOCUMENT_STATUSES })
  documentStatus!: DocumentStatus;

  @ApiPropertyOptional({ nullable: true, example: 'application/pdf' })
  documentMimeType!: string | null;
}
