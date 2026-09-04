import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateCountryDto {
  @ApiProperty({ example: 'CD', description: 'ISO 3166-1 alpha-2' })
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Za-z]{2}$/)
  code!: string;

  @ApiProperty({ example: 'Congo, Democratic Republic of the' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: 'COD', description: 'ISO 3166-1 alpha-3' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Za-z]{3}$/)
  code3?: string;

  @ApiPropertyOptional({ example: '+243' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  phoneCode?: string;
}
