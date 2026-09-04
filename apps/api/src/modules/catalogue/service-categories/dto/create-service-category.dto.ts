import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateServiceCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'INSTALL' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'Installation' })
  @IsString()
  @MaxLength(255)
  name!: string;
}
