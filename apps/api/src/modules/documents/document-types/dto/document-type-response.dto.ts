import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentTypeResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Null for global system types',
  })
  organizationId!: string | null;

  @ApiProperty({ example: 'QUOTE' })
  code!: string;

  @ApiProperty({ example: 'Quotation' })
  name!: string;

  @ApiPropertyOptional({
    nullable: true,
    type: [String],
    example: ['application/pdf'],
  })
  allowedMimeTypes!: string[] | null;

  @ApiProperty({
    description: 'True when organizationId is null (system type)',
  })
  isSystem!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
