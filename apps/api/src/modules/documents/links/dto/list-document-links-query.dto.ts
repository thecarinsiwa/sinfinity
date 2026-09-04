import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  DOCUMENT_LINK_ENTITY_TYPES,
  DOCUMENT_LINK_ROLES,
  type DocumentLinkEntityType,
  type DocumentLinkRole,
} from '../document-links.catalog';

export class ListDocumentLinksQueryDto extends PaginationQueryDto {
  @ApiProperty({
    enum: DOCUMENT_LINK_ENTITY_TYPES,
    example: 'customer',
    description: 'Entity type to list documents for',
  })
  @IsIn(DOCUMENT_LINK_ENTITY_TYPES)
  entityType!: DocumentLinkEntityType;

  @ApiProperty({ description: 'Entity id to list documents for' })
  @IsUUID('all')
  entityId!: string;

  @ApiPropertyOptional({
    description: 'Filter by organization (super-admin). Ignored for org users.',
  })
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({ enum: DOCUMENT_LINK_ROLES })
  @IsOptional()
  @IsIn(DOCUMENT_LINK_ROLES)
  role?: DocumentLinkRole;
}
