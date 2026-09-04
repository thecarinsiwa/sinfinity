import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { createId } from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { quotation_statuses } from '../../../database/schema';
import {
  fromBool,
  nowMysqlDateTime,
} from '../../settings/utils/mysql-datetime';
import { SYSTEM_QUOTATION_STATUSES } from './quotation-statuses.catalog';

export type QuotationStatusesSeedResult = {
  inserted: number;
  updated: number;
};

@Injectable()
export class QuotationStatusesSeedService {
  private readonly logger = new Logger(QuotationStatusesSeedService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /** Idempotent seed of global quotation statuses. */
  async seed(): Promise<QuotationStatusesSeedResult> {
    const result: QuotationStatusesSeedResult = { inserted: 0, updated: 0 };

    for (const def of SYSTEM_QUOTATION_STATUSES) {
      const [existing] = await this.db
        .select({ id: quotation_statuses.id })
        .from(quotation_statuses)
        .where(eq(quotation_statuses.code, def.code))
        .limit(1);

      if (existing) {
        await this.db
          .update(quotation_statuses)
          .set({
            name: def.name,
            is_final: fromBool(def.isFinal),
            sort_order: def.sortOrder,
            updated_at: nowMysqlDateTime(),
          })
          .where(eq(quotation_statuses.id, existing.id));
        result.updated += 1;
        continue;
      }

      await this.db.insert(quotation_statuses).values({
        id: createId(),
        code: def.code,
        name: def.name,
        is_final: fromBool(def.isFinal),
        sort_order: def.sortOrder,
      });
      result.inserted += 1;
    }

    this.logger.log(
      `Quotation statuses seed done: +${result.inserted} inserted, ${result.updated} updated`,
    );
    return result;
  }
}
