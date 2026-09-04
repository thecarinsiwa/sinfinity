import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { createId } from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { activity_types } from '../../../database/schema';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { SYSTEM_ACTIVITY_TYPES } from './activity-types.catalog';

export type ActivityTypesSeedResult = {
  inserted: number;
  updated: number;
};

@Injectable()
export class ActivityTypesSeedService {
  private readonly logger = new Logger(ActivityTypesSeedService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /** Idempotent seed of global activity types. */
  async seed(): Promise<ActivityTypesSeedResult> {
    const result: ActivityTypesSeedResult = { inserted: 0, updated: 0 };

    for (const def of SYSTEM_ACTIVITY_TYPES) {
      const [existing] = await this.db
        .select({ id: activity_types.id })
        .from(activity_types)
        .where(eq(activity_types.code, def.code))
        .limit(1);

      if (existing) {
        await this.db
          .update(activity_types)
          .set({
            name: def.name,
            icon: def.icon,
            updated_at: nowMysqlDateTime(),
          })
          .where(eq(activity_types.id, existing.id));
        result.updated += 1;
        continue;
      }

      await this.db.insert(activity_types).values({
        id: createId(),
        code: def.code,
        name: def.name,
        icon: def.icon,
      });
      result.inserted += 1;
    }

    this.logger.log(
      `Activity types seed done: +${result.inserted} inserted, ${result.updated} updated`,
    );
    return result;
  }
}
