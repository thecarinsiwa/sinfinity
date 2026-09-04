import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateLeadSourceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'LINKEDIN' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'LinkedIn' })
  @IsString()
  @MaxLength(255)
  name!: string;
}
