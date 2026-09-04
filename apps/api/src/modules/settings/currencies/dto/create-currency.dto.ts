import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCurrencyDto {
  @ApiProperty({ example: 'USD', description: 'ISO 4217' })
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Za-z]{3}$/)
  code!: string;

  @ApiProperty({ example: 'US Dollar' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: '$' })
  @IsString()
  @MaxLength(16)
  symbol!: string;

  @ApiPropertyOptional({ example: 2, default: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(8)
  decimalPlaces?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
