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
  ConvertServiceRequestDto,
  ConvertServiceRequestResponseDto,
  CreateServiceRequestDto,
  ListServiceRequestsQueryDto,
  ServiceRequestResponseDto,
  TransitionServiceRequestDto,
  UpdateServiceRequestDto,
} from './dto/service-request.dto';
import { ServiceRequestsService } from './service-requests.service';

@ApiTags(SWAGGER_TAG.Maintenance)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('service-requests')
export class ServiceRequestsController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
  ) {}

  @Get()
  @RequirePermissions('tickets.read')
  @ApiOperation({
    summary: 'List service requests',
    description: 'Filter status, customerId, requestType.',
  })
  @ApiPaginatedResponse(ServiceRequestResponseDto)
  findAll(
    @Query() query: ListServiceRequestsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<ServiceRequestResponseDto>> {
    return this.serviceRequestsService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('tickets.read')
  @ApiOperation({ summary: 'Get a service request' })
  @ApiOkResponse({ type: ServiceRequestResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ServiceRequestResponseDto> {
    return this.serviceRequestsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('tickets.write')
  @ApiOperation({ summary: 'Create a service request' })
  @ApiCreatedResponse({ type: ServiceRequestResponseDto })
  create(
    @Body() dto: CreateServiceRequestDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ServiceRequestResponseDto> {
    return this.serviceRequestsService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('tickets.write')
  @ApiOperation({
    summary: 'Update a service request',
    description: 'Not allowed when completed or cancelled.',
  })
  @ApiOkResponse({ type: ServiceRequestResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceRequestDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ServiceRequestResponseDto> {
    return this.serviceRequestsService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('tickets.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a service request',
    description: 'Only new or cancelled. Hard delete.',
  })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.serviceRequestsService.remove(id, organizationId, user);
  }

  @Post(':id/transition')
  @RequirePermissions('tickets.write')
  @ApiOperation({
    summary: 'Transition service request status',
    description: 'new → assigned|completed|cancelled.',
  })
  @ApiOkResponse({ type: ServiceRequestResponseDto })
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionServiceRequestDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ServiceRequestResponseDto> {
    return this.serviceRequestsService.transition(
      id,
      dto,
      organizationId,
      user,
    );
  }

  @Post(':id/convert')
  @RequirePermissions('tickets.write')
  @ApiOperation({
    summary: 'Convert a service request into a support ticket',
    description:
      'Creates a ticket, sets convertedTicketId, marks the request completed.',
  })
  @ApiOkResponse({ type: ConvertServiceRequestResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  convert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertServiceRequestDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ConvertServiceRequestResponseDto> {
    return this.serviceRequestsService.convert(id, dto, organizationId, user);
  }
}
