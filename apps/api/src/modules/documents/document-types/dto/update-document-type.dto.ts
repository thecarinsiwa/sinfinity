import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateDocumentTypeDto {
  @ApiPropertyOptional({ example: 'Customs certificate' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    type: [String],
    nullable: true,
    example: ['application/pdf'],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @MaxLength(128, { each: true })
  allowedMimeTypes?: string[] | null;
}
