import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID, MaxLength } from 'class-validator';
import {
  DOCUMENT_LINK_ENTITY_TYPES,
  DOCUMENT_LINK_ROLES,
  type DocumentLinkEntityType,
  type DocumentLinkRole,
} from '../document-links.catalog';

export class CreateDocumentLinkDto {
  @ApiProperty()
  @IsUUID('all')
  documentId!: string;

  @ApiProperty({
    enum: DOCUMENT_LINK_ENTITY_TYPES,
    example: 'customer',
    description: 'Polymorphic entity type (allowlisted)',
  })
  @IsIn(DOCUMENT_LINK_ENTITY_TYPES)
  entityType!: DocumentLinkEntityType;

  @ApiProperty()
  @IsUUID('all')
  entityId!: string;

  @ApiPropertyOptional({
    enum: DOCUMENT_LINK_ROLES,
    example: 'attachment',
    description: 'Link role (allowlisted)',
  })
  @IsOptional()
  @IsIn(DOCUMENT_LINK_ROLES)
  @MaxLength(64)
  role?: DocumentLinkRole;
}
