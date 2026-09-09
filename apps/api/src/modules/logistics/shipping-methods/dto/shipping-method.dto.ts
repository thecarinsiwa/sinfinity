import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateShippingMethodDto {
  @ApiProperty({ example: 'SEA', description: 'Unique code (SEA, AIR, ROAD, RAIL…)' })
  @IsString()
  @MaxLength(32)
  code!: string;

  @ApiProperty({ example: 'Sea freight' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class UpdateShippingMethodDto {
  @ApiPropertyOptional({ example: 'SEA' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  code?: string;

  @ApiPropertyOptional({ example: 'Sea freight' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class ShippingMethodResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'SEA' })
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
