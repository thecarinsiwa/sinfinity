import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  CurrentUser,
  JwtAuthGuard,
  OrganizationId,
  PermissionsGuard,
  RequirePermissions,
  type AuthUser,
  type PaginatedResponseDto,
} from '../../../common';
import { SWAGGER_BEARER_AUTH } from '../../../config/constants';
import { SWAGGER_TAG } from '../../../config/swagger-tags';
import { ListSalesActivitiesQueryDto } from '../../crm/sales-activities/dto/list-sales-activities-query.dto';
import { SalesActivityResponseDto } from '../../crm/sales-activities/dto/sales-activity-response.dto';
import { SalesActivitiesService } from '../../crm/sales-activities/sales-activities.service';

/**
 * Phase 18 design decision — activities fusion
 *
 * The generic `activities` table is unused by the API. CRM already exposes a
 * full CRUD on `sales_activities` (`relatedType`: lead|customer|opportunity).
 * To avoid duplication we keep writes on `/sales-activities` and expose this
 * read alias under the Collaboration tag for a stable transverse path.
 *
 * See also: database/modules/17_communication.md (fusion note).
 */
@ApiTags(SWAGGER_TAG.Collaboration)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('activities')
export class ActivitiesAliasController {
  constructor(
    private readonly salesActivitiesService: SalesActivitiesService,
  ) {}

  @Get()
  @RequirePermissions('activities.read')
  @ApiOperation({
    summary: 'List activities (alias)',
    description:
      'Read-only alias of GET /sales-activities. Writes remain on /sales-activities. ' +
      'Table `activities` is not used — CRM sales_activities is the source of truth.',
  })
  @ApiPaginatedResponse(SalesActivityResponseDto)
  findAll(
    @Query() query: ListSalesActivitiesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<SalesActivityResponseDto>> {
    return this.salesActivitiesService.findAll(query, organizationId, user);
  }
}
