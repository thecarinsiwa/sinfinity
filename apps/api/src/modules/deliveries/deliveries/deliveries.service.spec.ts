import { BadRequestException } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { DELIVERY_STATUS } from '../delivery-statuses';

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
  chain.innerJoin = jest.fn(self);
  return chain;
}

describe('DeliveriesService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const soId = '0191e6b8-4c3a-7b2d-9f1e-sososososososo';
  const customerId = '0191e6b8-4c3a-7b2d-9f1e-custcustcustc';
  const warehouseId = '0191e6b8-4c3a-7b2d-9f1e-whwhwhwhwhwh';
  const deliveryId = '0191e6b8-4c3a-7b2d-9f1e-dlvdlvdlvdlvd';
  const soItemId = '0191e6b8-4c3a-7b2d-9f1e-soitsoitsoits';
  const productId = '0191e6b8-4c3a-7b2d-9f1e-prodprodprodp';

  let service: DeliveriesService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    transaction: jest.Mock;
  };
  let inventoryMovementsService: { applyMovement: jest.Mock };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
      delete: jest.fn().mockReturnValue(thenable(undefined)),
      transaction: jest.fn(async (fn: (tx: typeof db) => unknown) => fn(db)),
    };
    inventoryMovementsService = {
      applyMovement: jest.fn().mockResolvedValue({}),
    };
    service = new DeliveriesService(
      db as never,
      inventoryMovementsService as never,
    );
  });

  it('rejects create when customer does not match sales order', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([
          {
            id: soId,
            customer_id: customerId,
            organization_id: orgId,
            status: 'in_progress',
            deleted_at: null,
          },
        ]),
      );

    await expect(
      service.create(
        {
          organizationId: orgId,
          deliveryNumber: 'DLV-1',
          salesOrderId: soId,
          customerId: '0191e6b8-4c3a-7b2d-9f1e-otherotheroth',
          warehouseId,
        },
        orgId,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects item when quantity exceeds remaining to deliver', async () => {
    const planned = {
      id: deliveryId,
      organization_id: orgId,
      delivery_number: 'DLV-1',
      sales_order_id: soId,
      customer_id: customerId,
      warehouse_id: warehouseId,
      delivery_address_id: null,
      scheduled_at: null,
      delivered_at: null,
      driver_user_id: null,
      status: DELIVERY_STATUS.PLANNED,
      notes: null,
      created_at: '2026-01-01 00:00:00.000',
      updated_at: '2026-01-01 00:00:00.000',
      created_by: null,
      updated_by: null,
      deleted_at: null,
    };

    db.select
      .mockReturnValueOnce(thenable([planned]))
      .mockReturnValueOnce(
        thenable([
          {
            id: soItemId,
            sales_order_id: soId,
            product_id: productId,
            quantity: '5.0000',
            quantity_delivered: '3.0000',
          },
        ]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: productId,
            organization_id: orgId,
            deleted_at: null,
            is_serialized: 0,
          },
        ]),
      )
      .mockReturnValueOnce(thenable([])); // open allocations

    await expect(
      service.createItem(
        deliveryId,
        {
          salesOrderItemId: soItemId,
          quantity: '3',
        },
        orgId,
      ),
    ).rejects.toThrow(/remaining to deliver/);
  });

  it('complete applies out and syncs SO to delivered', async () => {
    const inTransit = {
      id: deliveryId,
      organization_id: orgId,
      delivery_number: 'DLV-1',
      sales_order_id: soId,
      customer_id: customerId,
      warehouse_id: warehouseId,
      delivery_address_id: null,
      scheduled_at: null,
      delivered_at: null,
      driver_user_id: null,
      status: DELIVERY_STATUS.IN_TRANSIT,
      notes: null,
      created_at: '2026-01-01 00:00:00.000',
      updated_at: '2026-01-01 00:00:00.000',
      created_by: null,
      updated_by: null,
      deleted_at: null,
    };
    const item = {
      id: '0191e6b8-4c3a-7b2d-9f1e-itemitemitemi',
      delivery_id: deliveryId,
      sales_order_item_id: soItemId,
      product_id: productId,
      quantity: '2.0000',
      serial_number_ids: null,
      created_at: '2026-01-01 00:00:00.000',
      updated_at: '2026-01-01 00:00:00.000',
    };

    db.select
      .mockReturnValueOnce(thenable([inTransit])) // requireAccess
      .mockReturnValueOnce(thenable([item])) // loadItems
      .mockReturnValueOnce(
        thenable([
          {
            id: soId,
            status: 'in_progress',
            deleted_at: null,
            organization_id: orgId,
          },
        ]),
      )
      // inside tx: reservation lookup
      .mockReturnValueOnce(thenable([]))
      // so item for qty update
      .mockReturnValueOnce(
        thenable([
          {
            id: soItemId,
            quantity: '2.0000',
            quantity_delivered: '0.0000',
          },
        ]),
      )
      // sync SO lines
      .mockReturnValueOnce(
        thenable([
          {
            quantity: '2.0000',
            quantity_delivered: '2.0000',
          },
        ]),
      )
      // findOne after
      .mockReturnValueOnce(
        thenable([{ ...inTransit, status: DELIVERY_STATUS.DELIVERED }]),
      )
      .mockReturnValueOnce(thenable([item]));

    await service.complete(deliveryId, orgId);

    expect(inventoryMovementsService.applyMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        movementType: 'out',
        quantity: '2.0000',
        referenceType: 'delivery',
        referenceId: deliveryId,
        warehouseId,
      }),
      db,
    );
    expect(db.insert).toHaveBeenCalled(); // SO status history
  });

  it('start rejects empty delivery', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([
          {
            id: deliveryId,
            organization_id: orgId,
            delivery_number: 'DLV-1',
            sales_order_id: soId,
            customer_id: customerId,
            warehouse_id: warehouseId,
            delivery_address_id: null,
            scheduled_at: null,
            delivered_at: null,
            driver_user_id: null,
            status: DELIVERY_STATUS.PLANNED,
            notes: null,
            created_at: '2026-01-01 00:00:00.000',
            updated_at: '2026-01-01 00:00:00.000',
            created_by: null,
            updated_by: null,
            deleted_at: null,
          },
        ]),
      )
      .mockReturnValueOnce(thenable([]));

    await expect(service.start(deliveryId, orgId)).rejects.toThrow(
      /without line items/,
    );
  });
});
