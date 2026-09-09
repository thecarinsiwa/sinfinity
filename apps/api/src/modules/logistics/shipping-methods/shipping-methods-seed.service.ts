import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { createId } from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { shipping_methods } from '../../../database/schema';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { SYSTEM_SHIPPING_METHODS } from './shipping-methods.catalog';

export type ShippingMethodsSeedResult = {
  inserted: number;
  updated: number;
};

@Injectable()
export class ShippingMethodsSeedService {
  private readonly logger = new Logger(ShippingMethodsSeedService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /** Idempotent seed of global shipping methods (SEA, AIR, ROAD, RAIL). */
  async seed(): Promise<ShippingMethodsSeedResult> {
    const result: ShippingMethodsSeedResult = { inserted: 0, updated: 0 };

    for (const def of SYSTEM_SHIPPING_METHODS) {
      const [existing] = await this.db
        .select({ id: shipping_methods.id })
        .from(shipping_methods)
        .where(eq(shipping_methods.code, def.code))
        .limit(1);

      if (existing) {
        await this.db
          .update(shipping_methods)
          .set({
            name: def.name,
            description: def.description,
            updated_at: nowMysqlDateTime(),
          })
          .where(eq(shipping_methods.id, existing.id));
        result.updated += 1;
        continue;
      }

      await this.db.insert(shipping_methods).values({
        id: createId(),
        code: def.code,
        name: def.name,
        description: def.description,
      });
      result.inserted += 1;
    }

    this.logger.log(
      `Shipping methods seed done: +${result.inserted} inserted, ${result.updated} updated`,
    );
    return result;
  }
}
