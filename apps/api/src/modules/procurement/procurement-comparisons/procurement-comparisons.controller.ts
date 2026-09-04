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
  CreateProcurementComparisonDto,
  ProcurementComparisonResponseDto,
} from './dto/procurement-comparison.dto';
import { ProcurementComparisonsService } from './procurement-comparisons.service';

@ApiTags(SWAGGER_TAG.Sourcing)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('procurement-requests/:requestId/comparisons')
export class ProcurementComparisonsController {
  constructor(
    private readonly procurementComparisonsService: ProcurementComparisonsService,
  ) {}

  @Get()
  @RequirePermissions('procurement.read')
  @ApiOperation({
    summary: 'List comparisons for a procurement request',
    description: 'Oldest first.',
  })
  @ApiOkResponse({ type: [ProcurementComparisonResponseDto] })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  list(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProcurementComparisonResponseDto[]> {
    return this.procurementComparisonsService.list(
      requestId,
      organizationId,
      user,
    );
  }

  @Post()
  @RequirePermissions('procurement.write')
  @ApiOperation({
    summary: 'Record a quote comparison',
    description:
      'criteria/scores are free-form JSON. Optional selectedQuoteId marks that quote selected. Moves request quoted → compared. Does not create a purchase order.',
  })
  @ApiCreatedResponse({ type: ProcurementComparisonResponseDto })
  create(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: CreateProcurementComparisonDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ProcurementComparisonResponseDto> {
    return this.procurementComparisonsService.create(
      requestId,
      dto,
      organizationId,
      user,
    );
  }
}
