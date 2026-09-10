import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginLogResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  userId!: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'admin@sinfinity.cd' })
  emailAttempted!: string | null;

  @ApiProperty({ example: true })
  success!: boolean;

  @ApiPropertyOptional({ nullable: true, example: 'invalid_password' })
  failureReason!: string | null;

  @ApiPropertyOptional({ nullable: true })
  ipAddress!: string | null;

  @ApiPropertyOptional({ nullable: true })
  userAgent!: string | null;

  @ApiProperty()
  createdAt!: string;
}
