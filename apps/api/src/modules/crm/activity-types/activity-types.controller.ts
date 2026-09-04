import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  ErrorResponseDto,
  JwtAuthGuard,
  ParseUUIDPipe,
  PermissionsGuard,
  RequirePermissions,
  type PaginatedResponseDto,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import { ActivityTypesService } from './activity-types.service';
import { ActivityTypeResponseDto } from './dto/activity-type-response.dto';
import { ListActivityTypesQueryDto } from './dto/list-activity-types-query.dto';

@ApiTags(SWAGGER_TAG.Crm)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('activity-types')
export class ActivityTypesController {
  constructor(private readonly activityTypesService: ActivityTypesService) {}

  @Get()
  @RequirePermissions('activities.read')
  @ApiOperation({
    summary: 'List activity types',
    description: 'Global reference (CALL, EMAIL, MEETING, VISIT). Read-only.',
  })
  @ApiPaginatedResponse(ActivityTypeResponseDto)
  findAll(
    @Query() query: ListActivityTypesQueryDto,
  ): Promise<PaginatedResponseDto<ActivityTypeResponseDto>> {
    return this.activityTypesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('activities.read')
  @ApiOperation({ summary: 'Get an activity type by id' })
  @ApiOkResponse({ type: ActivityTypeResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ActivityTypeResponseDto> {
    return this.activityTypesService.findOne(id);
  }
}
