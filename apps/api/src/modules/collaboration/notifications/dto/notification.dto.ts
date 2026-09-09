import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import {
  NOTIFICATION_CHANNELS,
  type NotificationChannel,
} from '../../notification-channels';

export class ListNotificationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  organizationId?: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Default true: only unread. Pass false to include all.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return value === true || value === 'true' || value === 1 || value === '1';
  })
  @IsBoolean()
  unreadOnly?: boolean;

  @ApiPropertyOptional({ enum: NOTIFICATION_CHANNELS })
  @IsOptional()
  @IsIn([...NOTIFICATION_CHANNELS])
  channel?: NotificationChannel;

  @ApiPropertyOptional({ example: 'ticket' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('all')
  entityId?: string;
}

export class NotificationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ enum: NOTIFICATION_CHANNELS })
  channel!: NotificationChannel;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  body!: string | null;

  @ApiPropertyOptional({ nullable: true })
  entityType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  entityId!: string | null;

  @ApiProperty()
  isRead!: boolean;

  @ApiProperty()
  sentAt!: string;

  @ApiPropertyOptional({ nullable: true })
  readAt!: string | null;
}
