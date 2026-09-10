import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  ErrorResponseDto,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  type PaginatedResponseDto,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import { ListLoginLogsQueryDto } from './dto/list-login-logs-query.dto';
import { LoginLogResponseDto } from './dto/login-log-response.dto';
import { LoginLogsService } from './login-logs.service';

@ApiTags(SWAGGER_TAG.Securite)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('login-logs')
export class LoginLogsController {
  constructor(private readonly loginLogsService: LoginLogsService) {}

  @Get()
  @RequirePermissions('audit.read')
  @ApiOperation({
    summary: 'List login logs',
    description:
      'Append-only authentication attempts. Filters: email, userId, success, dateFrom/dateTo. Never includes passwords.',
  })
  @ApiPaginatedResponse(LoginLogResponseDto)
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  findAll(
    @Query() query: ListLoginLogsQueryDto,
  ): Promise<PaginatedResponseDto<LoginLogResponseDto>> {
    return this.loginLogsService.findAll(query);
  }
}
