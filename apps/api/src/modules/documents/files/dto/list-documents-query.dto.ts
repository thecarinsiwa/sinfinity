import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  DOCUMENT_LINK_ENTITY_TYPES,
  type DocumentLinkEntityType,
} from '../../links/document-links.catalog';
import {
  DOCUMENT_STATUSES,
  type DocumentStatus,
} from './document-response.dto';

export class ListDocumentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by organization (super-admin). Ignored for org users.',
  })
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  documentTypeId?: string;

  @ApiPropertyOptional({ enum: DOCUMENT_STATUSES })
  @IsOptional()
  @IsIn(DOCUMENT_STATUSES)
  status?: DocumentStatus;

  @ApiPropertyOptional({
    enum: DOCUMENT_LINK_ENTITY_TYPES,
    description:
      'Filter documents linked to this polymorphic entity type (via document_links).',
  })
  @IsOptional()
  @IsIn(DOCUMENT_LINK_ENTITY_TYPES)
  entityType?: DocumentLinkEntityType;

  @ApiPropertyOptional({
    description:
      'Filter by linked entity id. Requires entityType. Exact match on document_links.',
  })
  @IsOptional()
  @IsUUID('all')
  entityId?: string;

  @ApiPropertyOptional({ example: 'quotation' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}
