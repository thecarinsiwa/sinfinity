import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class SetRolePermissionsDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Permission UUIDs to assign (exact set replaces existing)',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  permissionIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['quotations.read', 'quotations.approve'],
    description: 'Permission codes to assign (exact set replaces existing)',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissionCodes?: string[];
}
