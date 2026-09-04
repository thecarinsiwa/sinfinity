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
  CreateSupplierEvaluationDto,
  ListSupplierEvaluationsQueryDto,
  SupplierEvaluationResponseDto,
  UpdateSupplierEvaluationDto,
  UpdateSupplierRatingQueryDto,
} from './dto/supplier-evaluation.dto';
import { SupplierEvaluationsService } from './supplier-evaluations.service';

@ApiTags(SWAGGER_TAG.Fournisseurs)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('supplier-evaluations')
export class SupplierEvaluationsController {
  constructor(
    private readonly supplierEvaluationsService: SupplierEvaluationsService,
  ) {}

  @Get()
  @RequirePermissions('suppliers.read')
  @ApiOperation({ summary: 'List supplier evaluations' })
  @ApiPaginatedResponse(SupplierEvaluationResponseDto)
  findAll(
    @Query() query: ListSupplierEvaluationsQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<SupplierEvaluationResponseDto>> {
    return this.supplierEvaluationsService.findAll(
      query,
      organizationId,
      user,
    );
  }

  @Get(':id')
  @RequirePermissions('suppliers.read')
  @ApiOperation({ summary: 'Get a supplier evaluation by id' })
  @ApiOkResponse({ type: SupplierEvaluationResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierEvaluationResponseDto> {
    return this.supplierEvaluationsService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('suppliers.write')
  @ApiOperation({
    summary: 'Create a supplier evaluation',
    description:
      'Scores 1–5. overallScore defaults to average of provided scores. Pass updateSupplierRating=true (query or body) to update suppliers.rating and append history.',
  })
  @ApiCreatedResponse({ type: SupplierEvaluationResponseDto })
  create(
    @Body() dto: CreateSupplierEvaluationDto,
    @Query() query: UpdateSupplierRatingQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierEvaluationResponseDto> {
    return this.supplierEvaluationsService.create(
      dto,
      query.updateSupplierRating === true ||
        dto.updateSupplierRating === true,
      organizationId,
      user,
    );
  }

  @Patch(':id')
  @RequirePermissions('suppliers.write')
  @ApiOperation({
    summary: 'Update a supplier evaluation',
    description:
      'Pass updateSupplierRating=true (query or body) to update suppliers.rating and append history.',
  })
  @ApiOkResponse({ type: SupplierEvaluationResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierEvaluationDto,
    @Query() query: UpdateSupplierRatingQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<SupplierEvaluationResponseDto> {
    return this.supplierEvaluationsService.update(
      id,
      dto,
      query.updateSupplierRating === true ||
        dto.updateSupplierRating === true,
      organizationId,
      user,
    );
  }

  @Delete(':id')
  @RequirePermissions('suppliers.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete a supplier evaluation' })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.supplierEvaluationsService.remove(id, organizationId, user);
  }
}
