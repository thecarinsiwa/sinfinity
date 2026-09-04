import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Allow, IsOptional, IsString, MaxLength } from 'class-validator';

/** Multipart fields for POST /documents/:id/versions. */
export class UploadDocumentVersionDto {
  @ApiPropertyOptional({ example: 'Corrected totals' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  changeNotes?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'New file version',
  })
  @Allow()
  file!: unknown;
}
