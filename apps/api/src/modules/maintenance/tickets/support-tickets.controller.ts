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
  AssignSupportTicketDto,
  CreateSupportTicketDto,
  ListSupportTicketsQueryDto,
  SupportTicketResponseDto,
  TransitionSupportTicketDto,
  UpdateSupportTicketDto,
} from './dto/support-ticket.dto';
import { SupportTicketsService } from './support-tickets.service';

@ApiTags(SWAGGER_TAG.Maintenance)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tickets')
export class SupportTicketsController {
  constructor(private readonly supportTicketsService: SupportTicketsService) {}

  @Get()
  @RequirePermissions('tickets.read')
  @ApiOperation({
    summary: 'List support tickets',
    description:
      'Search ticketNumber; filter status, priority, customer, assignee.',
  })
  @ApiPaginatedResponse(SupportTicketResponseDto)
  findAll(
    @Query() query: ListSupportTicketsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<SupportTicketResponseDto>> {
    return this.supportTicketsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('tickets.read')
  @ApiOperation({ summary: 'Get a support ticket' })
  @ApiOkResponse({ type: SupportTicketResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupportTicketResponseDto> {
    return this.supportTicketsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('tickets.write')
  @ApiOperation({
    summary: 'Create a support ticket',
    description: 'ticketNumber unique per organization.',
  })
  @ApiCreatedResponse({ type: SupportTicketResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateSupportTicketDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupportTicketResponseDto> {
    return this.supportTicketsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('tickets.write')
  @ApiOperation({
    summary: 'Update a support ticket',
    description:
      'Not allowed when closed. Use assign / transition for assignee and status.',
  })
  @ApiOkResponse({ type: SupportTicketResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupportTicketDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupportTicketResponseDto> {
    return this.supportTicketsService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('tickets.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete a support ticket',
    description: 'Only open or closed tickets.',
  })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.supportTicketsService.remove(id, organizationId, user);
  }

  @Post(':id/transition')
  @RequirePermissions('tickets.write')
  @ApiOperation({
    summary: 'Transition ticket status',
    description:
      'open → in_progress|waiting → resolved → closed. Sets closedAt on resolved/closed.',
  })
  @ApiOkResponse({ type: SupportTicketResponseDto })
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionSupportTicketDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupportTicketResponseDto> {
    return this.supportTicketsService.transition(id, dto, organizationId, user);
  }

  @Post(':id/assign')
  @RequirePermissions('tickets.assign')
  @ApiOperation({
    summary: 'Assign or unassign a ticket',
    description:
      'Requires tickets.assign. assignedTo null clears the assignee.',
  })
  @ApiOkResponse({ type: SupportTicketResponseDto })
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignSupportTicketDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupportTicketResponseDto> {
    return this.supportTicketsService.assign(id, dto, organizationId, user);
  }
}
