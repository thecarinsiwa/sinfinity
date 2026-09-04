import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  ErrorResponseDto,
  JwtAuthGuard,
  OrganizationId,
  ParseUUIDPipe,
  PermissionsGuard,
  RequirePermissions,
  type AuthUser,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import {
  CreateProcurementApprovalDto,
  ProcurementApprovalResponseDto,
} from './dto/procurement-approval.dto';
import { ProcurementApprovalsService } from './procurement-approvals.service';

@ApiTags(SWAGGER_TAG.Sourcing)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('procurement-requests/:requestId/approvals')
export class ProcurementApprovalsController {
  constructor(
    private readonly procurementApprovalsService: ProcurementApprovalsService,
  ) {}

  @Get()
  @RequirePermissions('procurement.read')
  @ApiOperation({ summary: 'List approvals for a procurement request' })
  @ApiOkResponse({ type: [ProcurementApprovalResponseDto] })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  list(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProcurementApprovalResponseDto[]> {
    return this.procurementApprovalsService.list(
      requestId,
      organizationId,
      user,
    );
  }

  @Post()
  @RequirePermissions('procurement.approve')
  @ApiOperation({
    summary: 'Submit a procurement approval decision',
    description:
      'status pending|approved|rejected. On approved, request becomes approved. Does not create a purchase order (Phase 10).',
  })
  @ApiCreatedResponse({ type: ProcurementApprovalResponseDto })
  create(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: CreateProcurementApprovalDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProcurementApprovalResponseDto> {
    return this.procurementApprovalsService.create(
      requestId,
      dto,
      organizationId,
      user,
    );
  }
}
