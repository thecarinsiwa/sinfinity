import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSupplierCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiProperty({ example: 'ELEC' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @MaxLength(255)
  name!: string;
}
