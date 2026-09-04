import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateDocumentTypeDto {
  @ApiPropertyOptional({
    description:
      'Defaults to the authenticated organization. Super-admin may set explicitly. Omit for org-scoped types only (system types come from seed).',
  })
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'CUSTOM_CERT' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'Customs certificate' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['application/pdf', 'image/png'],
    nullable: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @MaxLength(128, { each: true })
  allowedMimeTypes?: string[] | null;
}
