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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
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
  AncillaryFeesService,
  LANDED_COST_FX_RULE,
} from './ancillary-fees.service';
import {
  CreateCustomsCostDto,
  CreateHandlingCostDto,
  CreateInspectionCostDto,
  CreateLocalTransportCostDto,
  CreateOtherProcurementCostDto,
  CreateShippingCostDto,
  CustomsCostResponseDto,
  HandlingCostResponseDto,
  InspectionCostResponseDto,
  LocalTransportCostResponseDto,
  OtherProcurementCostResponseDto,
  ShippingCostResponseDto,
  UpdateCustomsCostDto,
  UpdateHandlingCostDto,
  UpdateInspectionCostDto,
  UpdateLocalTransportCostDto,
  UpdateOtherProcurementCostDto,
  UpdateShippingCostDto,
} from './dto/ancillary-fees.dto';

const FEE_WRITE_NOTE =
  'Not allowed when landed cost is posted. Resets status to draft. ' +
  LANDED_COST_FX_RULE;

@ApiTags(SWAGGER_TAG.CoutRendu)
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('landed-costs/:landedCostId')
export class AncillaryFeesController {
  constructor(private readonly ancillaryFeesService: AncillaryFeesService) {}

  // --- Shipping ---

  @Get('shipping-costs')
  @RequirePermissions('landed_costs.read')
  @ApiOperation({ summary: 'List shipping costs for a landed cost' })
  @ApiOkResponse({ type: [ShippingCostResponseDto] })
  listShipping(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ShippingCostResponseDto[]> {
    return this.ancillaryFeesService.listShippingCosts(
      landedCostId,
      organizationId,
      user,
    );
  }

  @Post('shipping-costs')
  @RequirePermissions('landed_costs.write')
  @ApiOperation({
    summary: 'Add a shipping cost',
    description: FEE_WRITE_NOTE,
  })
  @ApiCreatedResponse({ type: ShippingCostResponseDto })
  createShipping(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Body() dto: CreateShippingCostDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ShippingCostResponseDto> {
    return this.ancillaryFeesService.createShippingCost(
      landedCostId,
      dto,
      organizationId,
      user,
    );
  }

  @Get('shipping-costs/:feeId')
  @RequirePermissions('landed_costs.read')
  @ApiOperation({ summary: 'Get a shipping cost' })
  @ApiOkResponse({ type: ShippingCostResponseDto })
  getShipping(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Param('feeId', ParseUUIDPipe) feeId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ShippingCostResponseDto> {
    return this.ancillaryFeesService.getShippingCost(
      landedCostId,
      feeId,
      organizationId,
      user,
    );
  }

  @Patch('shipping-costs/:feeId')
  @RequirePermissions('landed_costs.write')
  @ApiOperation({
    summary: 'Update a shipping cost',
    description: FEE_WRITE_NOTE,
  })
  @ApiOkResponse({ type: ShippingCostResponseDto })
  updateShipping(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Param('feeId', ParseUUIDPipe) feeId: string,
    @Body() dto: UpdateShippingCostDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ShippingCostResponseDto> {
    return this.ancillaryFeesService.updateShippingCost(
      landedCostId,
      feeId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete('shipping-costs/:feeId')
  @RequirePermissions('landed_costs.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a shipping cost',
    description: FEE_WRITE_NOTE,
  })
  @ApiNoContentResponse()
  removeShipping(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Param('feeId', ParseUUIDPipe) feeId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.ancillaryFeesService.removeShippingCost(
      landedCostId,
      feeId,
      organizationId,
      user,
    );
  }

  // --- Customs ---

  @Get('customs-costs')
  @RequirePermissions('landed_costs.read')
  @ApiOperation({ summary: 'List customs costs for a landed cost' })
  @ApiOkResponse({ type: [CustomsCostResponseDto] })
  listCustoms(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomsCostResponseDto[]> {
    return this.ancillaryFeesService.listCustomsCosts(
      landedCostId,
      organizationId,
      user,
    );
  }

  @Post('customs-costs')
  @RequirePermissions('landed_costs.write')
  @ApiOperation({
    summary: 'Add a customs cost',
    description:
      FEE_WRITE_NOTE +
      ' Amount for calculate = dutiesAmount + vatAmount + otherFees.',
  })
  @ApiCreatedResponse({ type: CustomsCostResponseDto })
  createCustoms(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Body() dto: CreateCustomsCostDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomsCostResponseDto> {
    return this.ancillaryFeesService.createCustomsCost(
      landedCostId,
      dto,
      organizationId,
      user,
    );
  }

  @Get('customs-costs/:feeId')
  @RequirePermissions('landed_costs.read')
  @ApiOperation({ summary: 'Get a customs cost' })
  @ApiOkResponse({ type: CustomsCostResponseDto })
  getCustoms(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Param('feeId', ParseUUIDPipe) feeId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomsCostResponseDto> {
    return this.ancillaryFeesService.getCustomsCost(
      landedCostId,
      feeId,
      organizationId,
      user,
    );
  }

  @Patch('customs-costs/:feeId')
  @RequirePermissions('landed_costs.write')
  @ApiOperation({
    summary: 'Update a customs cost',
    description: FEE_WRITE_NOTE,
  })
  @ApiOkResponse({ type: CustomsCostResponseDto })
  updateCustoms(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Param('feeId', ParseUUIDPipe) feeId: string,
    @Body() dto: UpdateCustomsCostDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<CustomsCostResponseDto> {
    return this.ancillaryFeesService.updateCustomsCost(
      landedCostId,
      feeId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete('customs-costs/:feeId')
  @RequirePermissions('landed_costs.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a customs cost',
    description: FEE_WRITE_NOTE,
  })
  @ApiNoContentResponse()
  removeCustoms(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Param('feeId', ParseUUIDPipe) feeId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.ancillaryFeesService.removeCustomsCost(
      landedCostId,
      feeId,
      organizationId,
      user,
    );
  }

  // --- Local transport ---

  @Get('local-transport-costs')
  @RequirePermissions('landed_costs.read')
  @ApiOperation({ summary: 'List local transport costs for a landed cost' })
  @ApiOkResponse({ type: [LocalTransportCostResponseDto] })
  listLocalTransport(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<LocalTransportCostResponseDto[]> {
    return this.ancillaryFeesService.listLocalTransportCosts(
      landedCostId,
      organizationId,
      user,
    );
  }

  @Post('local-transport-costs')
  @RequirePermissions('landed_costs.write')
  @ApiOperation({
    summary: 'Add a local transport cost',
    description: FEE_WRITE_NOTE,
  })
  @ApiCreatedResponse({ type: LocalTransportCostResponseDto })
  createLocalTransport(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Body() dto: CreateLocalTransportCostDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<LocalTransportCostResponseDto> {
    return this.ancillaryFeesService.createLocalTransportCost(
      landedCostId,
      dto,
      organizationId,
      user,
    );
  }

  @Get('local-transport-costs/:feeId')
  @RequirePermissions('landed_costs.read')
  @ApiOperation({ summary: 'Get a local transport cost' })
  @ApiOkResponse({ type: LocalTransportCostResponseDto })
  getLocalTransport(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Param('feeId', ParseUUIDPipe) feeId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<LocalTransportCostResponseDto> {
    return this.ancillaryFeesService.getLocalTransportCost(
      landedCostId,
      feeId,
      organizationId,
      user,
    );
  }

  @Patch('local-transport-costs/:feeId')
  @RequirePermissions('landed_costs.write')
  @ApiOperation({
    summary: 'Update a local transport cost',
    description: FEE_WRITE_NOTE,
  })
  @ApiOkResponse({ type: LocalTransportCostResponseDto })
  updateLocalTransport(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Param('feeId', ParseUUIDPipe) feeId: string,
    @Body() dto: UpdateLocalTransportCostDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<LocalTransportCostResponseDto> {
    return this.ancillaryFeesService.updateLocalTransportCost(
      landedCostId,
      feeId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete('local-transport-costs/:feeId')
  @RequirePermissions('landed_costs.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a local transport cost',
    description: FEE_WRITE_NOTE,
  })
  @ApiNoContentResponse()
  removeLocalTransport(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Param('feeId', ParseUUIDPipe) feeId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.ancillaryFeesService.removeLocalTransportCost(
      landedCostId,
      feeId,
      organizationId,
      user,
    );
  }

  // --- Inspection ---

  @Get('inspection-costs')
  @RequirePermissions('landed_costs.read')
  @ApiOperation({ summary: 'List inspection costs for a landed cost' })
  @ApiOkResponse({ type: [InspectionCostResponseDto] })
  listInspection(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InspectionCostResponseDto[]> {
    return this.ancillaryFeesService.listInspectionCosts(
      landedCostId,
      organizationId,
      user,
    );
  }

  @Post('inspection-costs')
  @RequirePermissions('landed_costs.write')
  @ApiOperation({
    summary: 'Add an inspection cost',
    description: FEE_WRITE_NOTE,
  })
  @ApiCreatedResponse({ type: InspectionCostResponseDto })
  createInspection(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Body() dto: CreateInspectionCostDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InspectionCostResponseDto> {
    return this.ancillaryFeesService.createInspectionCost(
      landedCostId,
      dto,
      organizationId,
      user,
    );
  }

  @Get('inspection-costs/:feeId')
  @RequirePermissions('landed_costs.read')
  @ApiOperation({ summary: 'Get an inspection cost' })
  @ApiOkResponse({ type: InspectionCostResponseDto })
  getInspection(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Param('feeId', ParseUUIDPipe) feeId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InspectionCostResponseDto> {
    return this.ancillaryFeesService.getInspectionCost(
      landedCostId,
      feeId,
      organizationId,
      user,
    );
  }

  @Patch('inspection-costs/:feeId')
  @RequirePermissions('landed_costs.write')
  @ApiOperation({
    summary: 'Update an inspection cost',
    description: FEE_WRITE_NOTE,
  })
  @ApiOkResponse({ type: InspectionCostResponseDto })
  updateInspection(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Param('feeId', ParseUUIDPipe) feeId: string,
    @Body() dto: UpdateInspectionCostDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<InspectionCostResponseDto> {
    return this.ancillaryFeesService.updateInspectionCost(
      landedCostId,
      feeId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete('inspection-costs/:feeId')
  @RequirePermissions('landed_costs.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an inspection cost',
    description: FEE_WRITE_NOTE,
  })
  @ApiNoContentResponse()
  removeInspection(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Param('feeId', ParseUUIDPipe) feeId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.ancillaryFeesService.removeInspectionCost(
      landedCostId,
      feeId,
      organizationId,
      user,
    );
  }

  // --- Handling ---

  @Get('handling-costs')
  @RequirePermissions('landed_costs.read')
  @ApiOperation({ summary: 'List handling costs for a landed cost' })
  @ApiOkResponse({ type: [HandlingCostResponseDto] })
  listHandling(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<HandlingCostResponseDto[]> {
    return this.ancillaryFeesService.listHandlingCosts(
      landedCostId,
      organizationId,
      user,
    );
  }

  @Post('handling-costs')
  @RequirePermissions('landed_costs.write')
  @ApiOperation({
    summary: 'Add a handling cost',
    description: FEE_WRITE_NOTE,
  })
  @ApiCreatedResponse({ type: HandlingCostResponseDto })
  createHandling(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Body() dto: CreateHandlingCostDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<HandlingCostResponseDto> {
    return this.ancillaryFeesService.createHandlingCost(
      landedCostId,
      dto,
      organizationId,
      user,
    );
  }

  @Get('handling-costs/:feeId')
  @RequirePermissions('landed_costs.read')
  @ApiOperation({ summary: 'Get a handling cost' })
  @ApiOkResponse({ type: HandlingCostResponseDto })
  getHandling(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Param('feeId', ParseUUIDPipe) feeId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<HandlingCostResponseDto> {
    return this.ancillaryFeesService.getHandlingCost(
      landedCostId,
      feeId,
      organizationId,
      user,
    );
  }

  @Patch('handling-costs/:feeId')
  @RequirePermissions('landed_costs.write')
  @ApiOperation({
    summary: 'Update a handling cost',
    description: FEE_WRITE_NOTE,
  })
  @ApiOkResponse({ type: HandlingCostResponseDto })
  updateHandling(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Param('feeId', ParseUUIDPipe) feeId: string,
    @Body() dto: UpdateHandlingCostDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<HandlingCostResponseDto> {
    return this.ancillaryFeesService.updateHandlingCost(
      landedCostId,
      feeId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete('handling-costs/:feeId')
  @RequirePermissions('landed_costs.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a handling cost',
    description: FEE_WRITE_NOTE,
  })
  @ApiNoContentResponse()
  removeHandling(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Param('feeId', ParseUUIDPipe) feeId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.ancillaryFeesService.removeHandlingCost(
      landedCostId,
      feeId,
      organizationId,
      user,
    );
  }

  // --- Other procurement ---

  @Get('other-procurement-costs')
  @RequirePermissions('landed_costs.read')
  @ApiOperation({ summary: 'List other procurement costs for a landed cost' })
  @ApiOkResponse({ type: [OtherProcurementCostResponseDto] })
  listOther(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<OtherProcurementCostResponseDto[]> {
    return this.ancillaryFeesService.listOtherProcurementCosts(
      landedCostId,
      organizationId,
      user,
    );
  }

  @Post('other-procurement-costs')
  @RequirePermissions('landed_costs.write')
  @ApiOperation({
    summary: 'Add another procurement cost',
    description: FEE_WRITE_NOTE,
  })
  @ApiCreatedResponse({ type: OtherProcurementCostResponseDto })
  createOther(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Body() dto: CreateOtherProcurementCostDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<OtherProcurementCostResponseDto> {
    return this.ancillaryFeesService.createOtherProcurementCost(
      landedCostId,
      dto,
      organizationId,
      user,
    );
  }

  @Get('other-procurement-costs/:feeId')
  @RequirePermissions('landed_costs.read')
  @ApiOperation({ summary: 'Get another procurement cost' })
  @ApiOkResponse({ type: OtherProcurementCostResponseDto })
  getOther(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Param('feeId', ParseUUIDPipe) feeId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<OtherProcurementCostResponseDto> {
    return this.ancillaryFeesService.getOtherProcurementCost(
      landedCostId,
      feeId,
      organizationId,
      user,
    );
  }

  @Patch('other-procurement-costs/:feeId')
  @RequirePermissions('landed_costs.write')
  @ApiOperation({
    summary: 'Update another procurement cost',
    description: FEE_WRITE_NOTE,
  })
  @ApiOkResponse({ type: OtherProcurementCostResponseDto })
  updateOther(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Param('feeId', ParseUUIDPipe) feeId: string,
    @Body() dto: UpdateOtherProcurementCostDto,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<OtherProcurementCostResponseDto> {
    return this.ancillaryFeesService.updateOtherProcurementCost(
      landedCostId,
      feeId,
      dto,
      organizationId,
      user,
    );
  }

  @Delete('other-procurement-costs/:feeId')
  @RequirePermissions('landed_costs.write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete another procurement cost',
    description: FEE_WRITE_NOTE,
  })
  @ApiNoContentResponse()
  removeOther(
    @Param('landedCostId', ParseUUIDPipe) landedCostId: string,
    @Param('feeId', ParseUUIDPipe) feeId: string,
    @OrganizationId() organizationId?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<void> {
    return this.ancillaryFeesService.removeOtherProcurementCost(
      landedCostId,
      feeId,
      organizationId,
      user,
    );
  }
}
