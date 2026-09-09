import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  CurrentUser,
  ErrorResponseDto,
  JwtAuthGuard,
  OrganizationId,
  ParseUUIDPipe,
  PermissionsGuard,
  RequirePermissions,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import {
  AppointmentResponseDto,
  CreateAppointmentDto,
  ListAppointmentsQueryDto,
  TransitionAppointmentDto,
  UpdateAppointmentDto,
} from './dto/appointment.dto';
import { AppointmentsService } from './appointments.service';

@ApiTags(SWAGGER_TAG.Collaboration)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @RequirePermissions('appointments.read')
  @ApiOperation({
    summary: 'List appointments',
    description:
      'Filter status, meetingType, organizer, customer, startFrom/startTo.',
  })
  @ApiPaginatedResponse(AppointmentResponseDto)
  findAll(
    @Query() query: ListAppointmentsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<AppointmentResponseDto>> {
    return this.appointmentsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('appointments.read')
  @ApiOperation({ summary: 'Get an appointment' })
  @ApiOkResponse({ type: AppointmentResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('appointments.write')
  @ApiOperation({
    summary: 'Create an appointment',
    description:
      'Rejects if organizer has an overlapping non-cancelled appointment.',
  })
  @ApiCreatedResponse({ type: AppointmentResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateAppointmentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('appointments.write')
  @ApiOperation({
    summary: 'Update an appointment',
    description: 'Only while scheduled. Re-checks organizer overlap.',
  })
  @ApiOkResponse({ type: AppointmentResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('appointments.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an appointment' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.appointmentsService.remove(id, organizationId, user);
  }

  @Post(':id/transition')
  @RequirePermissions('appointments.write')
  @ApiOperation({
    summary: 'Transition appointment status',
    description: 'scheduled → completed|cancelled|no_show',
  })
  @ApiOkResponse({ type: AppointmentResponseDto })
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionAppointmentDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.transition(
      id,
      dto,
      organizationId,
      user,
    );
  }
}
