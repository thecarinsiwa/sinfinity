import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Sinfinity SARL' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: 'Sinfinity Société à Responsabilité Limitée' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalName?: string;

  @ApiPropertyOptional({ example: 'A1234567M' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  taxId?: string;

  @ApiPropertyOptional({ example: 'contact@sinfinity.cd' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: '+243810000000' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  phone?: string;

  @ApiPropertyOptional({ example: 'https://sinfinity.cd' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'FK currencies.id' })
  @IsOptional()
  @IsUUID('all')
  defaultCurrencyId?: string | null;

  @ApiPropertyOptional({ description: 'FK countries.id' })
  @IsOptional()
  @IsUUID('all')
  countryId?: string | null;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
