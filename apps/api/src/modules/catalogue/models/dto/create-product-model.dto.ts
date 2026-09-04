import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateProductModelDto {
  @ApiProperty()
  @IsUUID('all')
  brandId!: string;

  @ApiProperty({ example: 'Catalyst 9300' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'C9300-24T',
    description: 'Manufacturer SKU (unique per brand when set)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  manufacturerSku?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;
}
