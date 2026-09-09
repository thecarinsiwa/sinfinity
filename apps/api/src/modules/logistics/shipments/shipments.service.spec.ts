import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ShipmentsService } from './shipments.service';

type Thenable<T> = PromiseLike<T> & Record<string, unknown>;

function thenable<T>(value: T): Thenable<T> {
  const chain: Thenable<T> = {
    then: (onFulfilled, onRejected) =>
      Promise.resolve(value).then(onFulfilled, onRejected),
  } as Thenable<T>;
  const self = () => chain;
  chain.from = jest.fn(self);
  chain.where = jest.fn(self);
  chain.orderBy = jest.fn(self);
  chain.limit = jest.fn(self);
  chain.offset = jest.fn(self);
  chain.$dynamic = jest.fn(self);
  chain.set = jest.fn(self);
  chain.values = jest.fn(self);
  return chain;
}

describe('ShipmentsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const poId = '0191e6b8-4c3a-7b2d-9f1e-popopopopopo';
  const shipmentId = '0191e6b8-4c3a-7b2d-9f1e-shipshipship';
  const productId = '0191e6b8-4c3a-7b2d-9f1e-prodprodprod';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const shipmentRow = {
    id: shipmentId,
    organization_id: orgId,
    shipment_number: 'SHP-2026-001',
    purchase_order_id: poId,
    carrier_id: null as string | null,
    shipping_method_id: null as string | null,
    container_number: null as string | null,
    bl_number: null as string | null,
    origin_country_id: null as string | null,
    destination_country_id: null as string | null,
    etd: null as string | null,
    eta: null as string | null,
    atd: null as string | null,
    ata: null as string | null,
    status: 'booked' as const,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  let service: ShipmentsService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
      delete: jest.fn().mockReturnValue(thenable(undefined)),
    };
    service = new ShipmentsService(db as never);
  });

  it('creates a booked shipment linked to a PO', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: poId, organization_id: orgId, deleted_at: null }]),
      )
      .mockReturnValueOnce(thenable([shipmentRow]))
      .mockReturnValueOnce(thenable([]));

    const result = await service.create(
      { shipmentNumber: 'SHP-2026-001', purchaseOrderId: poId },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalled();
    expect(result.status).toBe('booked');
    expect(result.purchaseOrderId).toBe(poId);
  });

  it('maps duplicate shipment number to ConflictException', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: poId, organization_id: orgId, deleted_at: null }]),
      );
    db.insert.mockReturnValueOnce({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create(
        { shipmentNumber: 'SHP-2026-001', purchaseOrderId: poId },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects illegal status transitions', async () => {
    db.select.mockReturnValueOnce(thenable([shipmentRow]));

    await expect(
      service.transition(
        shipmentId,
        { toStatus: 'arrived' },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('transitions booked→in_transit and writes a tracking event', async () => {
    db.select
      .mockReturnValueOnce(thenable([shipmentRow]))
      .mockReturnValueOnce(
        thenable([{ ...shipmentRow, status: 'in_transit' }]),
      )
      .mockReturnValueOnce(thenable([]));

    const result = await service.transition(
      shipmentId,
      { toStatus: 'in_transit', notes: 'Departed port' },
      orgId,
      orgUser,
    );

    expect(db.update).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
    expect(result.status).toBe('in_transit');
  });

  it('rejects item without productId or purchaseOrderItemId', async () => {
    db.select.mockReturnValueOnce(thenable([shipmentRow]));

    await expect(
      service.addItem(
        shipmentId,
        { quantity: '1' } as never,
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('adds a tracking event with carrier source', async () => {
    db.select
      .mockReturnValueOnce(thenable([shipmentRow]))
      .mockReturnValueOnce(
        thenable([
          {
            id: 'evt-1',
            shipment_id: shipmentId,
            status: 'in_transit',
            location: 'Shanghai',
            event_at: '2026-09-04 10:00:00.000',
            description: null,
            source: 'carrier',
            created_at: '2026-09-04 10:00:00.000',
          },
        ]),
      );

    const result = await service.addTracking(
      shipmentId,
      {
        status: 'in_transit',
        location: 'Shanghai',
        eventAt: '2026-09-04T10:00:00.000Z',
        source: 'carrier',
      },
      orgId,
      orgUser,
    );

    expect(result.source).toBe('carrier');
    expect(db.insert).toHaveBeenCalled();
  });

  it('adds an item with productId', async () => {
    db.select
      .mockReturnValueOnce(thenable([shipmentRow]))
      .mockReturnValueOnce(
        thenable([
          {
            id: productId,
            organization_id: orgId,
            deleted_at: null,
          },
        ]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: 'si-1',
            shipment_id: shipmentId,
            purchase_order_item_id: null,
            product_id: productId,
            quantity: '2.0000',
            weight_kg: '10.0000',
            volume_cbm: null,
            created_at: '2026-09-04 10:00:00.000',
            updated_at: '2026-09-04 10:00:00.000',
          },
        ]),
      );

    const result = await service.addItem(
      shipmentId,
      { productId, quantity: '2', weightKg: '10' },
      orgId,
      orgUser,
    );

    expect(result.productId).toBe(productId);
    expect(result.quantity).toBe('2.0000');
  });
});
