import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCityDto {
  @ApiProperty({ example: '0191e6b8-4c3a-7b2d-9f1e-2a3b4c5d6e7f' })
  @IsUUID('all')
  countryId!: string;

  @ApiProperty({ example: 'Kinshasa' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    example: 'Kinshasa',
    description: 'Province / region; blank becomes null',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  region?: string | null;
}
