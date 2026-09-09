import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { createId, type AuthUser } from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  carriers,
  customs_costs,
  customs_declarations,
  handling_costs,
  inspection_costs,
  local_transport_costs,
  other_procurement_costs,
  shipping_costs,
  shipping_methods,
  shipments,
} from '../../../database/schema';
import { throwFkOrRethrow } from '../../settings/utils/mysql-errors';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { formatDecimal } from '../landed-costs-totals';
import { LandedCostsService } from '../landed-costs/landed-costs.service';
import { LANDED_COST_FX_RULE } from './currency-conversion';
import type {
  CreateCustomsCostDto,
  CreateHandlingCostDto,
  CreateInspectionCostDto,
  CreateLocalTransportCostDto,
  CreateOtherProcurementCostDto,
  CreateShippingCostDto,
  CustomsCostResponseDto,
  HandlingCostResponseDto,
  InspectionCostResponseDto,
  InspectionPlace,
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

export { LANDED_COST_FX_RULE };

@Injectable()
export class AncillaryFeesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly landedCostsService: LandedCostsService,
  ) {}

  // --- Shipping ---

  async listShippingCosts(
    landedCostId: string,
    orgId?: string,
    user?: AuthUser,
  ): Promise<ShippingCostResponseDto[]> {
    await this.landedCostsService.requireAccess(landedCostId, orgId, user);
    const rows = await this.db
      .select()
      .from(shipping_costs)
      .where(eq(shipping_costs.landed_cost_id, landedCostId))
      .orderBy(asc(shipping_costs.created_at), asc(shipping_costs.id));
    return rows.map((row) => ({
      id: row.id,
      landedCostId: row.landed_cost_id,
      shipmentId: row.shipment_id,
      shippingMethodId: row.shipping_method_id,
      carrierId: row.carrier_id,
      amount: row.amount,
      currencyId: row.currency_id,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async createShippingCost(
    landedCostId: string,
    dto: CreateShippingCostDto,
    orgId?: string,
    user?: AuthUser,
  ): Promise<ShippingCostResponseDto> {
    const header = await this.landedCostsService.requireMutableAccess(
      landedCostId,
      orgId,
      user,
    );
    if (dto.shipmentId) {
      await this.ensureShipmentInOrg(dto.shipmentId, header.organization_id);
    }
    if (dto.carrierId) {
      await this.ensureCarrierInOrg(dto.carrierId, header.organization_id);
    }
    if (dto.shippingMethodId) {
      await this.ensureShippingMethodExists(dto.shippingMethodId);
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(shipping_costs).values({
        id,
        landed_cost_id: landedCostId,
        shipment_id: dto.shipmentId ?? null,
        shipping_method_id: dto.shippingMethodId ?? null,
        carrier_id: dto.carrierId ?? null,
        amount: formatDecimal(Number(dto.amount ?? '0')),
        currency_id: dto.currencyId ?? null,
        description: dto.description ?? null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid shipment, shipping method, carrier or currency reference',
      );
    }
    await this.landedCostsService.markDraftAfterFeeChange(landedCostId);
    return this.getShippingCost(landedCostId, id, orgId, user);
  }

  async getShippingCost(
    landedCostId: string,
    feeId: string,
    orgId?: string,
    user?: AuthUser,
  ): Promise<ShippingCostResponseDto> {
    await this.landedCostsService.requireAccess(landedCostId, orgId, user);
    const [row] = await this.db
      .select()
      .from(shipping_costs)
      .where(
        and(
          eq(shipping_costs.id, feeId),
          eq(shipping_costs.landed_cost_id, landedCostId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Shipping cost ${feeId} not found`);
    }
    return {
      id: row.id,
      landedCostId: row.landed_cost_id,
      shipmentId: row.shipment_id,
      shippingMethodId: row.shipping_method_id,
      carrierId: row.carrier_id,
      amount: row.amount,
      currencyId: row.currency_id,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async updateShippingCost(
    landedCostId: string,
    feeId: string,
    dto: UpdateShippingCostDto,
    orgId?: string,
    user?: AuthUser,
  ): Promise<ShippingCostResponseDto> {
    const header = await this.landedCostsService.requireMutableAccess(
      landedCostId,
      orgId,
      user,
    );
    await this.getShippingCost(landedCostId, feeId, orgId, user);

    if (dto.shipmentId) {
      await this.ensureShipmentInOrg(dto.shipmentId, header.organization_id);
    }
    if (dto.carrierId) {
      await this.ensureCarrierInOrg(dto.carrierId, header.organization_id);
    }
    if (dto.shippingMethodId) {
      await this.ensureShippingMethodExists(dto.shippingMethodId);
    }

    const patch: Record<string, string | null> = {
      updated_at: nowMysqlDateTime(),
    };
    if (dto.shipmentId !== undefined) patch.shipment_id = dto.shipmentId;
    if (dto.shippingMethodId !== undefined)
      patch.shipping_method_id = dto.shippingMethodId;
    if (dto.carrierId !== undefined) patch.carrier_id = dto.carrierId;
    if (dto.amount !== undefined)
      patch.amount = formatDecimal(Number(dto.amount));
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.description !== undefined) patch.description = dto.description;

    try {
      await this.db
        .update(shipping_costs)
        .set(patch)
        .where(eq(shipping_costs.id, feeId));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid shipment, shipping method, carrier or currency reference',
      );
    }
    await this.landedCostsService.markDraftAfterFeeChange(landedCostId);
    return this.getShippingCost(landedCostId, feeId, orgId, user);
  }

  async removeShippingCost(
    landedCostId: string,
    feeId: string,
    orgId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.landedCostsService.requireMutableAccess(
      landedCostId,
      orgId,
      user,
    );
    await this.getShippingCost(landedCostId, feeId, orgId, user);
    await this.db
      .delete(shipping_costs)
      .where(eq(shipping_costs.id, feeId));
    await this.landedCostsService.markDraftAfterFeeChange(landedCostId);
  }

  // --- Customs ---

  async listCustomsCosts(
    landedCostId: string,
    orgId?: string,
    user?: AuthUser,
  ): Promise<CustomsCostResponseDto[]> {
    await this.landedCostsService.requireAccess(landedCostId, orgId, user);
    const rows = await this.db
      .select()
      .from(customs_costs)
      .where(eq(customs_costs.landed_cost_id, landedCostId))
      .orderBy(asc(customs_costs.created_at), asc(customs_costs.id));
    return rows.map((row) => this.toCustomsResponse(row));
  }

  async createCustomsCost(
    landedCostId: string,
    dto: CreateCustomsCostDto,
    orgId?: string,
    user?: AuthUser,
  ): Promise<CustomsCostResponseDto> {
    const header = await this.landedCostsService.requireMutableAccess(
      landedCostId,
      orgId,
      user,
    );
    if (dto.customsDeclarationId) {
      await this.ensureCustomsDeclarationInOrg(
        dto.customsDeclarationId,
        header.organization_id,
      );
    }

    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(customs_costs).values({
        id,
        landed_cost_id: landedCostId,
        customs_declaration_id: dto.customsDeclarationId ?? null,
        duties_amount: formatDecimal(Number(dto.dutiesAmount ?? '0')),
        vat_amount: formatDecimal(Number(dto.vatAmount ?? '0')),
        other_fees: formatDecimal(Number(dto.otherFees ?? '0')),
        currency_id: dto.currencyId ?? null,
        description: dto.description ?? null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid customs declaration or currency reference',
      );
    }
    await this.landedCostsService.markDraftAfterFeeChange(landedCostId);
    return this.getCustomsCost(landedCostId, id, orgId, user);
  }

  async getCustomsCost(
    landedCostId: string,
    feeId: string,
    orgId?: string,
    user?: AuthUser,
  ): Promise<CustomsCostResponseDto> {
    await this.landedCostsService.requireAccess(landedCostId, orgId, user);
    const [row] = await this.db
      .select()
      .from(customs_costs)
      .where(
        and(
          eq(customs_costs.id, feeId),
          eq(customs_costs.landed_cost_id, landedCostId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Customs cost ${feeId} not found`);
    }
    return this.toCustomsResponse(row);
  }

  async updateCustomsCost(
    landedCostId: string,
    feeId: string,
    dto: UpdateCustomsCostDto,
    orgId?: string,
    user?: AuthUser,
  ): Promise<CustomsCostResponseDto> {
    const header = await this.landedCostsService.requireMutableAccess(
      landedCostId,
      orgId,
      user,
    );
    await this.getCustomsCost(landedCostId, feeId, orgId, user);

    if (dto.customsDeclarationId) {
      await this.ensureCustomsDeclarationInOrg(
        dto.customsDeclarationId,
        header.organization_id,
      );
    }

    const patch: Record<string, string | null> = {
      updated_at: nowMysqlDateTime(),
    };
    if (dto.customsDeclarationId !== undefined)
      patch.customs_declaration_id = dto.customsDeclarationId;
    if (dto.dutiesAmount !== undefined)
      patch.duties_amount = formatDecimal(Number(dto.dutiesAmount));
    if (dto.vatAmount !== undefined)
      patch.vat_amount = formatDecimal(Number(dto.vatAmount));
    if (dto.otherFees !== undefined)
      patch.other_fees = formatDecimal(Number(dto.otherFees));
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.description !== undefined) patch.description = dto.description;

    try {
      await this.db
        .update(customs_costs)
        .set(patch)
        .where(eq(customs_costs.id, feeId));
    } catch (error) {
      throwFkOrRethrow(
        error,
        'Invalid customs declaration or currency reference',
      );
    }
    await this.landedCostsService.markDraftAfterFeeChange(landedCostId);
    return this.getCustomsCost(landedCostId, feeId, orgId, user);
  }

  async removeCustomsCost(
    landedCostId: string,
    feeId: string,
    orgId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.landedCostsService.requireMutableAccess(
      landedCostId,
      orgId,
      user,
    );
    await this.getCustomsCost(landedCostId, feeId, orgId, user);
    await this.db.delete(customs_costs).where(eq(customs_costs.id, feeId));
    await this.landedCostsService.markDraftAfterFeeChange(landedCostId);
  }

  // --- Local transport ---

  async listLocalTransportCosts(
    landedCostId: string,
    orgId?: string,
    user?: AuthUser,
  ): Promise<LocalTransportCostResponseDto[]> {
    await this.landedCostsService.requireAccess(landedCostId, orgId, user);
    const rows = await this.db
      .select()
      .from(local_transport_costs)
      .where(eq(local_transport_costs.landed_cost_id, landedCostId))
      .orderBy(
        asc(local_transport_costs.created_at),
        asc(local_transport_costs.id),
      );
    return rows.map((row) => this.toLocalTransportResponse(row));
  }

  async createLocalTransportCost(
    landedCostId: string,
    dto: CreateLocalTransportCostDto,
    orgId?: string,
    user?: AuthUser,
  ): Promise<LocalTransportCostResponseDto> {
    await this.landedCostsService.requireMutableAccess(
      landedCostId,
      orgId,
      user,
    );
    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(local_transport_costs).values({
        id,
        landed_cost_id: landedCostId,
        from_location: dto.fromLocation ?? null,
        to_location: dto.toLocation ?? null,
        amount: formatDecimal(Number(dto.amount ?? '0')),
        currency_id: dto.currencyId ?? null,
        provider: dto.provider ?? null,
        description: dto.description ?? null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid currency reference');
    }
    await this.landedCostsService.markDraftAfterFeeChange(landedCostId);
    return this.getLocalTransportCost(landedCostId, id, orgId, user);
  }

  async getLocalTransportCost(
    landedCostId: string,
    feeId: string,
    orgId?: string,
    user?: AuthUser,
  ): Promise<LocalTransportCostResponseDto> {
    await this.landedCostsService.requireAccess(landedCostId, orgId, user);
    const [row] = await this.db
      .select()
      .from(local_transport_costs)
      .where(
        and(
          eq(local_transport_costs.id, feeId),
          eq(local_transport_costs.landed_cost_id, landedCostId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Local transport cost ${feeId} not found`);
    }
    return this.toLocalTransportResponse(row);
  }

  async updateLocalTransportCost(
    landedCostId: string,
    feeId: string,
    dto: UpdateLocalTransportCostDto,
    orgId?: string,
    user?: AuthUser,
  ): Promise<LocalTransportCostResponseDto> {
    await this.landedCostsService.requireMutableAccess(
      landedCostId,
      orgId,
      user,
    );
    await this.getLocalTransportCost(landedCostId, feeId, orgId, user);

    const patch: Record<string, string | null> = {
      updated_at: nowMysqlDateTime(),
    };
    if (dto.fromLocation !== undefined) patch.from_location = dto.fromLocation;
    if (dto.toLocation !== undefined) patch.to_location = dto.toLocation;
    if (dto.amount !== undefined)
      patch.amount = formatDecimal(Number(dto.amount));
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.provider !== undefined) patch.provider = dto.provider;
    if (dto.description !== undefined) patch.description = dto.description;

    try {
      await this.db
        .update(local_transport_costs)
        .set(patch)
        .where(eq(local_transport_costs.id, feeId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid currency reference');
    }
    await this.landedCostsService.markDraftAfterFeeChange(landedCostId);
    return this.getLocalTransportCost(landedCostId, feeId, orgId, user);
  }

  async removeLocalTransportCost(
    landedCostId: string,
    feeId: string,
    orgId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.landedCostsService.requireMutableAccess(
      landedCostId,
      orgId,
      user,
    );
    await this.getLocalTransportCost(landedCostId, feeId, orgId, user);
    await this.db
      .delete(local_transport_costs)
      .where(eq(local_transport_costs.id, feeId));
    await this.landedCostsService.markDraftAfterFeeChange(landedCostId);
  }

  // --- Inspection ---

  async listInspectionCosts(
    landedCostId: string,
    orgId?: string,
    user?: AuthUser,
  ): Promise<InspectionCostResponseDto[]> {
    await this.landedCostsService.requireAccess(landedCostId, orgId, user);
    const rows = await this.db
      .select()
      .from(inspection_costs)
      .where(eq(inspection_costs.landed_cost_id, landedCostId))
      .orderBy(asc(inspection_costs.created_at), asc(inspection_costs.id));
    return rows.map((row) => this.toInspectionResponse(row));
  }

  async createInspectionCost(
    landedCostId: string,
    dto: CreateInspectionCostDto,
    orgId?: string,
    user?: AuthUser,
  ): Promise<InspectionCostResponseDto> {
    await this.landedCostsService.requireMutableAccess(
      landedCostId,
      orgId,
      user,
    );
    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(inspection_costs).values({
        id,
        landed_cost_id: landedCostId,
        inspection_place: dto.inspectionPlace ?? 'origin',
        inspector: dto.inspector ?? null,
        amount: formatDecimal(Number(dto.amount ?? '0')),
        currency_id: dto.currencyId ?? null,
        inspected_at: dto.inspectedAt ? dto.inspectedAt.slice(0, 10) : null,
        report_document_id: dto.reportDocumentId ?? null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid currency or document reference');
    }
    await this.landedCostsService.markDraftAfterFeeChange(landedCostId);
    return this.getInspectionCost(landedCostId, id, orgId, user);
  }

  async getInspectionCost(
    landedCostId: string,
    feeId: string,
    orgId?: string,
    user?: AuthUser,
  ): Promise<InspectionCostResponseDto> {
    await this.landedCostsService.requireAccess(landedCostId, orgId, user);
    const [row] = await this.db
      .select()
      .from(inspection_costs)
      .where(
        and(
          eq(inspection_costs.id, feeId),
          eq(inspection_costs.landed_cost_id, landedCostId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Inspection cost ${feeId} not found`);
    }
    return this.toInspectionResponse(row);
  }

  async updateInspectionCost(
    landedCostId: string,
    feeId: string,
    dto: UpdateInspectionCostDto,
    orgId?: string,
    user?: AuthUser,
  ): Promise<InspectionCostResponseDto> {
    await this.landedCostsService.requireMutableAccess(
      landedCostId,
      orgId,
      user,
    );
    await this.getInspectionCost(landedCostId, feeId, orgId, user);

    const patch: Record<string, string | null> = {
      updated_at: nowMysqlDateTime(),
    };
    if (dto.inspectionPlace !== undefined)
      patch.inspection_place = dto.inspectionPlace;
    if (dto.inspector !== undefined) patch.inspector = dto.inspector;
    if (dto.amount !== undefined)
      patch.amount = formatDecimal(Number(dto.amount));
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.inspectedAt !== undefined) {
      patch.inspected_at =
        dto.inspectedAt != null ? dto.inspectedAt.slice(0, 10) : null;
    }
    if (dto.reportDocumentId !== undefined)
      patch.report_document_id = dto.reportDocumentId;

    try {
      await this.db
        .update(inspection_costs)
        .set(patch)
        .where(eq(inspection_costs.id, feeId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid currency or document reference');
    }
    await this.landedCostsService.markDraftAfterFeeChange(landedCostId);
    return this.getInspectionCost(landedCostId, feeId, orgId, user);
  }

  async removeInspectionCost(
    landedCostId: string,
    feeId: string,
    orgId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.landedCostsService.requireMutableAccess(
      landedCostId,
      orgId,
      user,
    );
    await this.getInspectionCost(landedCostId, feeId, orgId, user);
    await this.db
      .delete(inspection_costs)
      .where(eq(inspection_costs.id, feeId));
    await this.landedCostsService.markDraftAfterFeeChange(landedCostId);
  }

  // --- Handling ---

  async listHandlingCosts(
    landedCostId: string,
    orgId?: string,
    user?: AuthUser,
  ): Promise<HandlingCostResponseDto[]> {
    await this.landedCostsService.requireAccess(landedCostId, orgId, user);
    const rows = await this.db
      .select()
      .from(handling_costs)
      .where(eq(handling_costs.landed_cost_id, landedCostId))
      .orderBy(asc(handling_costs.created_at), asc(handling_costs.id));
    return rows.map((row) => this.toHandlingResponse(row));
  }

  async createHandlingCost(
    landedCostId: string,
    dto: CreateHandlingCostDto,
    orgId?: string,
    user?: AuthUser,
  ): Promise<HandlingCostResponseDto> {
    await this.landedCostsService.requireMutableAccess(
      landedCostId,
      orgId,
      user,
    );
    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(handling_costs).values({
        id,
        landed_cost_id: landedCostId,
        location: dto.location ?? null,
        amount: formatDecimal(Number(dto.amount ?? '0')),
        currency_id: dto.currencyId ?? null,
        description: dto.description ?? null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid currency reference');
    }
    await this.landedCostsService.markDraftAfterFeeChange(landedCostId);
    return this.getHandlingCost(landedCostId, id, orgId, user);
  }

  async getHandlingCost(
    landedCostId: string,
    feeId: string,
    orgId?: string,
    user?: AuthUser,
  ): Promise<HandlingCostResponseDto> {
    await this.landedCostsService.requireAccess(landedCostId, orgId, user);
    const [row] = await this.db
      .select()
      .from(handling_costs)
      .where(
        and(
          eq(handling_costs.id, feeId),
          eq(handling_costs.landed_cost_id, landedCostId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Handling cost ${feeId} not found`);
    }
    return this.toHandlingResponse(row);
  }

  async updateHandlingCost(
    landedCostId: string,
    feeId: string,
    dto: UpdateHandlingCostDto,
    orgId?: string,
    user?: AuthUser,
  ): Promise<HandlingCostResponseDto> {
    await this.landedCostsService.requireMutableAccess(
      landedCostId,
      orgId,
      user,
    );
    await this.getHandlingCost(landedCostId, feeId, orgId, user);

    const patch: Record<string, string | null> = {
      updated_at: nowMysqlDateTime(),
    };
    if (dto.location !== undefined) patch.location = dto.location;
    if (dto.amount !== undefined)
      patch.amount = formatDecimal(Number(dto.amount));
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.description !== undefined) patch.description = dto.description;

    try {
      await this.db
        .update(handling_costs)
        .set(patch)
        .where(eq(handling_costs.id, feeId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid currency reference');
    }
    await this.landedCostsService.markDraftAfterFeeChange(landedCostId);
    return this.getHandlingCost(landedCostId, feeId, orgId, user);
  }

  async removeHandlingCost(
    landedCostId: string,
    feeId: string,
    orgId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.landedCostsService.requireMutableAccess(
      landedCostId,
      orgId,
      user,
    );
    await this.getHandlingCost(landedCostId, feeId, orgId, user);
    await this.db.delete(handling_costs).where(eq(handling_costs.id, feeId));
    await this.landedCostsService.markDraftAfterFeeChange(landedCostId);
  }

  // --- Other procurement ---

  async listOtherProcurementCosts(
    landedCostId: string,
    orgId?: string,
    user?: AuthUser,
  ): Promise<OtherProcurementCostResponseDto[]> {
    await this.landedCostsService.requireAccess(landedCostId, orgId, user);
    const rows = await this.db
      .select()
      .from(other_procurement_costs)
      .where(eq(other_procurement_costs.landed_cost_id, landedCostId))
      .orderBy(
        asc(other_procurement_costs.created_at),
        asc(other_procurement_costs.id),
      );
    return rows.map((row) => this.toOtherResponse(row));
  }

  async createOtherProcurementCost(
    landedCostId: string,
    dto: CreateOtherProcurementCostDto,
    orgId?: string,
    user?: AuthUser,
  ): Promise<OtherProcurementCostResponseDto> {
    await this.landedCostsService.requireMutableAccess(
      landedCostId,
      orgId,
      user,
    );
    const id = createId();
    const now = nowMysqlDateTime();
    try {
      await this.db.insert(other_procurement_costs).values({
        id,
        landed_cost_id: landedCostId,
        cost_type: dto.costType.trim(),
        amount: formatDecimal(Number(dto.amount ?? '0')),
        currency_id: dto.currencyId ?? null,
        description: dto.description ?? null,
        created_at: now,
        updated_at: now,
      });
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid currency reference');
    }
    await this.landedCostsService.markDraftAfterFeeChange(landedCostId);
    return this.getOtherProcurementCost(landedCostId, id, orgId, user);
  }

  async getOtherProcurementCost(
    landedCostId: string,
    feeId: string,
    orgId?: string,
    user?: AuthUser,
  ): Promise<OtherProcurementCostResponseDto> {
    await this.landedCostsService.requireAccess(landedCostId, orgId, user);
    const [row] = await this.db
      .select()
      .from(other_procurement_costs)
      .where(
        and(
          eq(other_procurement_costs.id, feeId),
          eq(other_procurement_costs.landed_cost_id, landedCostId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new NotFoundException(
        `Other procurement cost ${feeId} not found`,
      );
    }
    return this.toOtherResponse(row);
  }

  async updateOtherProcurementCost(
    landedCostId: string,
    feeId: string,
    dto: UpdateOtherProcurementCostDto,
    orgId?: string,
    user?: AuthUser,
  ): Promise<OtherProcurementCostResponseDto> {
    await this.landedCostsService.requireMutableAccess(
      landedCostId,
      orgId,
      user,
    );
    await this.getOtherProcurementCost(landedCostId, feeId, orgId, user);

    const patch: Record<string, string | null> = {
      updated_at: nowMysqlDateTime(),
    };
    if (dto.costType !== undefined) patch.cost_type = dto.costType.trim();
    if (dto.amount !== undefined)
      patch.amount = formatDecimal(Number(dto.amount));
    if (dto.currencyId !== undefined) patch.currency_id = dto.currencyId;
    if (dto.description !== undefined) patch.description = dto.description;

    try {
      await this.db
        .update(other_procurement_costs)
        .set(patch)
        .where(eq(other_procurement_costs.id, feeId));
    } catch (error) {
      throwFkOrRethrow(error, 'Invalid currency reference');
    }
    await this.landedCostsService.markDraftAfterFeeChange(landedCostId);
    return this.getOtherProcurementCost(landedCostId, feeId, orgId, user);
  }

  async removeOtherProcurementCost(
    landedCostId: string,
    feeId: string,
    orgId?: string,
    user?: AuthUser,
  ): Promise<void> {
    await this.landedCostsService.requireMutableAccess(
      landedCostId,
      orgId,
      user,
    );
    await this.getOtherProcurementCost(landedCostId, feeId, orgId, user);
    await this.db
      .delete(other_procurement_costs)
      .where(eq(other_procurement_costs.id, feeId));
    await this.landedCostsService.markDraftAfterFeeChange(landedCostId);
  }

  // --- Mappers / ensures ---

  private toCustomsResponse(row: {
    id: string;
    landed_cost_id: string;
    customs_declaration_id: string | null;
    duties_amount: string;
    vat_amount: string;
    other_fees: string;
    currency_id: string | null;
    description: string | null;
    created_at: string;
    updated_at: string;
  }): CustomsCostResponseDto {
    return {
      id: row.id,
      landedCostId: row.landed_cost_id,
      customsDeclarationId: row.customs_declaration_id,
      dutiesAmount: row.duties_amount,
      vatAmount: row.vat_amount,
      otherFees: row.other_fees,
      currencyId: row.currency_id,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toLocalTransportResponse(row: {
    id: string;
    landed_cost_id: string;
    from_location: string | null;
    to_location: string | null;
    amount: string;
    currency_id: string | null;
    provider: string | null;
    description: string | null;
    created_at: string;
    updated_at: string;
  }): LocalTransportCostResponseDto {
    return {
      id: row.id,
      landedCostId: row.landed_cost_id,
      fromLocation: row.from_location,
      toLocation: row.to_location,
      amount: row.amount,
      currencyId: row.currency_id,
      provider: row.provider,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toInspectionResponse(row: {
    id: string;
    landed_cost_id: string;
    inspection_place: string;
    inspector: string | null;
    amount: string;
    currency_id: string | null;
    inspected_at: string | null;
    report_document_id: string | null;
    created_at: string;
    updated_at: string;
  }): InspectionCostResponseDto {
    return {
      id: row.id,
      landedCostId: row.landed_cost_id,
      inspectionPlace: row.inspection_place as InspectionPlace,
      inspector: row.inspector,
      amount: row.amount,
      currencyId: row.currency_id,
      inspectedAt: row.inspected_at,
      reportDocumentId: row.report_document_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toHandlingResponse(row: {
    id: string;
    landed_cost_id: string;
    location: string | null;
    amount: string;
    currency_id: string | null;
    description: string | null;
    created_at: string;
    updated_at: string;
  }): HandlingCostResponseDto {
    return {
      id: row.id,
      landedCostId: row.landed_cost_id,
      location: row.location,
      amount: row.amount,
      currencyId: row.currency_id,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toOtherResponse(row: {
    id: string;
    landed_cost_id: string;
    cost_type: string;
    amount: string;
    currency_id: string | null;
    description: string | null;
    created_at: string;
    updated_at: string;
  }): OtherProcurementCostResponseDto {
    return {
      id: row.id,
      landedCostId: row.landed_cost_id,
      costType: row.cost_type,
      amount: row.amount,
      currencyId: row.currency_id,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private async ensureShipmentInOrg(
    shipmentId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: shipments.id,
        organization_id: shipments.organization_id,
        deleted_at: shipments.deleted_at,
      })
      .from(shipments)
      .where(eq(shipments.id, shipmentId))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Shipment ${shipmentId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Shipment must belong to the same organization',
      );
    }
  }

  private async ensureCarrierInOrg(
    carrierId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: carriers.id,
        organization_id: carriers.organization_id,
        deleted_at: carriers.deleted_at,
      })
      .from(carriers)
      .where(eq(carriers.id, carrierId))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(`Carrier ${carrierId} not found`);
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Carrier must belong to the same organization',
      );
    }
  }

  private async ensureShippingMethodExists(methodId: string): Promise<void> {
    const [row] = await this.db
      .select({ id: shipping_methods.id })
      .from(shipping_methods)
      .where(eq(shipping_methods.id, methodId))
      .limit(1);
    if (!row) {
      throw new NotFoundException(`Shipping method ${methodId} not found`);
    }
  }

  private async ensureCustomsDeclarationInOrg(
    declarationId: string,
    organizationId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: customs_declarations.id,
        organization_id: customs_declarations.organization_id,
        deleted_at: customs_declarations.deleted_at,
      })
      .from(customs_declarations)
      .where(eq(customs_declarations.id, declarationId))
      .limit(1);
    if (!row || row.deleted_at != null) {
      throw new NotFoundException(
        `Customs declaration ${declarationId} not found`,
      );
    }
    if (row.organization_id !== organizationId) {
      throw new BadRequestException(
        'Customs declaration must belong to the same organization',
      );
    }
  }
}
