import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { createId } from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import { document_types } from '../../../database/schema';
import { nowMysqlDateTime } from '../../settings/utils/mysql-datetime';
import { SYSTEM_DOCUMENT_TYPES } from './document-types.catalog';

export type DocumentTypesSeedResult = {
  inserted: number;
  updated: number;
};

@Injectable()
export class DocumentTypesSeedService {
  private readonly logger = new Logger(DocumentTypesSeedService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /** Idempotent seed of global system document types. */
  async seed(): Promise<DocumentTypesSeedResult> {
    const result: DocumentTypesSeedResult = { inserted: 0, updated: 0 };

    for (const def of SYSTEM_DOCUMENT_TYPES) {
      const [existing] = await this.db
        .select({ id: document_types.id })
        .from(document_types)
        .where(
          and(
            eq(document_types.code, def.code),
            isNull(document_types.organization_id),
          ),
        )
        .limit(1);

      if (existing) {
        await this.db
          .update(document_types)
          .set({
            name: def.name,
            allowed_mime_types: def.allowedMimeTypes,
            updated_at: nowMysqlDateTime(),
          })
          .where(eq(document_types.id, existing.id));
        result.updated += 1;
        continue;
      }

      await this.db.insert(document_types).values({
        id: createId(),
        organization_id: null,
        code: def.code,
        name: def.name,
        allowed_mime_types: def.allowedMimeTypes,
      });
      result.inserted += 1;
    }

    this.logger.log(
      `Document types seed done: +${result.inserted} inserted, ${result.updated} updated`,
    );
    return result;
  }
}
