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
  CreateWarrantyClaimDto,
  CreateWarrantyDto,
  ListWarrantiesQueryDto,
  TransitionWarrantyClaimDto,
  TransitionWarrantyDto,
  UpdateWarrantyClaimDto,
  UpdateWarrantyDto,
  WarrantyClaimResponseDto,
  WarrantyResponseDto,
} from './dto/warranty.dto';
import { WarrantiesService } from './warranties.service';

@ApiTags(SWAGGER_TAG.Maintenance)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('warranties')
export class WarrantiesController {
  constructor(private readonly warrantiesService: WarrantiesService) {}

  @Get()
  @RequirePermissions('warranties.read')
  @ApiOperation({
    summary: 'List warranties',
    description: 'Filter status, type, customer, product, serial.',
  })
  @ApiPaginatedResponse(WarrantyResponseDto)
  findAll(
    @Query() query: ListWarrantiesQueryDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<PaginatedResponseDto<WarrantyResponseDto>> {
    return this.warrantiesService.findAll(query, organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('warranties.read')
  @ApiOperation({ summary: 'Get a warranty with its claims' })
  @ApiOkResponse({ type: WarrantyResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<WarrantyResponseDto> {
    return this.warrantiesService.findOne(id, organizationId, user);
  }

  @Post()
  @RequirePermissions('warranties.write')
  @ApiOperation({
    summary: 'Create a warranty',
    description:
      'Often created after installation. warrantyType: manufacturer|seller|extended.',
  })
  @ApiCreatedResponse({ type: WarrantyResponseDto })
  create(
    @Body() dto: CreateWarrantyDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<WarrantyResponseDto> {
    return this.warrantiesService.create(dto, organizationId, user);
  }

  @Patch(':id')
  @RequirePermissions('warranties.write')
  @ApiOperation({
    summary: 'Update a warranty',
    description: 'Only while active.',
  })
  @ApiOkResponse({ type: WarrantyResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarrantyDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<WarrantyResponseDto> {
    return this.warrantiesService.update(id, dto, organizationId, user);
  }

  @Delete(':id')
  @RequirePermissions('warranties.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a warranty',
    description: 'Only void or expired. Cascades claims.',
  })
  @ApiNoContentResponse()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.warrantiesService.remove(id, organizationId, user);
  }

  @Post(':id/transition')
  @RequirePermissions('warranties.write')
  @ApiOperation({
    summary: 'Transition warranty status',
    description: 'active → expired|void.',
  })
  @ApiOkResponse({ type: WarrantyResponseDto })
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionWarrantyDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<WarrantyResponseDto> {
    return this.warrantiesService.transition(id, dto, organizationId, user);
  }

  @Get(':id/claims')
  @RequirePermissions('warranties.read')
  @ApiOperation({ summary: 'List warranty claims' })
  @ApiOkResponse({ type: [WarrantyClaimResponseDto] })
  listClaims(
    @Param('id', ParseUUIDPipe) id: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<WarrantyClaimResponseDto[]> {
    return this.warrantiesService.listClaims(id, organizationId, user);
  }

  @Post(':id/claims')
  @RequirePermissions('warranties.write')
  @ApiOperation({
    summary: 'Create a warranty claim',
    description: 'claimNumber unique per warranty. Status starts as submitted.',
  })
  @ApiCreatedResponse({ type: WarrantyClaimResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  createClaim(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateWarrantyClaimDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<WarrantyClaimResponseDto> {
    return this.warrantiesService.createClaim(id, dto, organizationId, user);
  }

  @Get(':id/claims/:claimId')
  @RequirePermissions('warranties.read')
  @ApiOperation({ summary: 'Get a warranty claim' })
  @ApiOkResponse({ type: WarrantyClaimResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findClaim(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('claimId', ParseUUIDPipe) claimId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<WarrantyClaimResponseDto> {
    return this.warrantiesService.findClaim(id, claimId, organizationId, user);
  }

  @Patch(':id/claims/:claimId')
  @RequirePermissions('warranties.write')
  @ApiOperation({
    summary: 'Update a warranty claim',
    description: 'Only while submitted.',
  })
  @ApiOkResponse({ type: WarrantyClaimResponseDto })
  updateClaim(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('claimId', ParseUUIDPipe) claimId: string,
    @Body() dto: UpdateWarrantyClaimDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<WarrantyClaimResponseDto> {
    return this.warrantiesService.updateClaim(
      id,
      claimId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete(':id/claims/:claimId')
  @RequirePermissions('warranties.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a warranty claim',
    description: 'Only while submitted.',
  })
  @ApiNoContentResponse()
  removeClaim(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('claimId', ParseUUIDPipe) claimId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.warrantiesService.removeClaim(
      id,
      claimId,
      organizationId,
      user,
    );
  }

  @Post(':id/claims/:claimId/transition')
  @RequirePermissions('warranties.claim')
  @ApiOperation({
    summary: 'Transition a warranty claim',
    description:
      'submitted → approved|rejected|fulfilled. Requires warranties.claim.',
  })
  @ApiOkResponse({ type: WarrantyClaimResponseDto })
  transitionClaim(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('claimId', ParseUUIDPipe) claimId: string,
    @Body() dto: TransitionWarrantyClaimDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<WarrantyClaimResponseDto> {
    return this.warrantiesService.transitionClaim(
      id,
      claimId,
      dto,
      organizationId,
      user,
    );
  }
}
