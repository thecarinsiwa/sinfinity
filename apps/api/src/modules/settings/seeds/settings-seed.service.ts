import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { createId } from '../../../common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  cities,
  countries,
  currencies,
  payment_terms,
  shipping_terms,
  taxes,
  units,
} from '../../../database/schema';
import { fromBool, nowMysqlDateTime } from '../utils/mysql-datetime';
import {
  SEED_CITIES,
  SEED_COUNTRIES,
  SEED_CURRENCIES,
  SEED_PAYMENT_TERMS,
  SEED_SHIPPING_TERMS,
  SEED_TAXES,
  SEED_UNITS,
} from './settings.catalog';

export type SeedBucketResult = {
  inserted: number;
  updated: number;
};

export type SettingsSeedResult = {
  inserted: number;
  updated: number;
  details: {
    currencies: SeedBucketResult;
    countries: SeedBucketResult;
    cities: SeedBucketResult;
    units: SeedBucketResult;
    shippingTerms: SeedBucketResult;
    paymentTerms: SeedBucketResult;
    taxes: SeedBucketResult;
  };
};

function emptyBucket(): SeedBucketResult {
  return { inserted: 0, updated: 0 };
}

/**
 * Idempotent global reference seed (currencies, geo, units, terms, TVA RDC).
 * Does not touch organization-scoped rows created by tenants.
 */
@Injectable()
export class SettingsSeedService {
  private readonly logger = new Logger(SettingsSeedService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async seed(): Promise<SettingsSeedResult> {
    const details = {
      currencies: emptyBucket(),
      countries: emptyBucket(),
      cities: emptyBucket(),
      units: emptyBucket(),
      shippingTerms: emptyBucket(),
      paymentTerms: emptyBucket(),
      taxes: emptyBucket(),
    };

    await this.seedCurrencies(details.currencies);
    await this.seedCountries(details.countries);
    await this.seedCities(details.cities);
    await this.seedUnits(details.units);
    await this.seedShippingTerms(details.shippingTerms);
    await this.seedPaymentTerms(details.paymentTerms);
    await this.seedTaxes(details.taxes);

    const inserted = Object.values(details).reduce((n, b) => n + b.inserted, 0);
    const updated = Object.values(details).reduce((n, b) => n + b.updated, 0);

    this.logger.log(
      `Settings seed done: +${inserted} inserted, ${updated} updated`,
    );

    return { inserted, updated, details };
  }

  private async seedCurrencies(bucket: SeedBucketResult): Promise<void> {
    const now = nowMysqlDateTime();
    for (const def of SEED_CURRENCIES) {
      const [existing] = await this.db
        .select({ id: currencies.id })
        .from(currencies)
        .where(eq(currencies.code, def.code))
        .limit(1);

      if (existing) {
        await this.db
          .update(currencies)
          .set({
            name: def.name,
            symbol: def.symbol,
            decimal_places: def.decimalPlaces,
            is_active: fromBool(true),
            updated_at: now,
          })
          .where(eq(currencies.id, existing.id));
        bucket.updated += 1;
        continue;
      }

      await this.db.insert(currencies).values({
        id: createId(),
        code: def.code,
        name: def.name,
        symbol: def.symbol,
        decimal_places: def.decimalPlaces,
        is_active: fromBool(true),
        created_at: now,
        updated_at: now,
      });
      bucket.inserted += 1;
    }
  }

  private async seedCountries(bucket: SeedBucketResult): Promise<void> {
    const now = nowMysqlDateTime();
    for (const def of SEED_COUNTRIES) {
      const [existing] = await this.db
        .select({ id: countries.id })
        .from(countries)
        .where(eq(countries.code, def.code))
        .limit(1);

      if (existing) {
        await this.db
          .update(countries)
          .set({
            code3: def.code3,
            name: def.name,
            phone_code: def.phoneCode,
            updated_at: now,
          })
          .where(eq(countries.id, existing.id));
        bucket.updated += 1;
        continue;
      }

      await this.db.insert(countries).values({
        id: createId(),
        code: def.code,
        code3: def.code3,
        name: def.name,
        phone_code: def.phoneCode,
        created_at: now,
        updated_at: now,
      });
      bucket.inserted += 1;
    }
  }

  private async seedCities(bucket: SeedBucketResult): Promise<void> {
    const now = nowMysqlDateTime();
    for (const def of SEED_CITIES) {
      const [country] = await this.db
        .select({ id: countries.id })
        .from(countries)
        .where(eq(countries.code, def.countryCode))
        .limit(1);
      if (!country) {
        this.logger.warn(
          `Skip city ${def.name}: country ${def.countryCode} missing`,
        );
        continue;
      }

      const [existing] = await this.db
        .select({ id: cities.id })
        .from(cities)
        .where(
          and(
            eq(cities.country_id, country.id),
            eq(cities.name, def.name),
            eq(cities.region, def.region),
          ),
        )
        .limit(1);

      if (existing) {
        await this.db
          .update(cities)
          .set({ updated_at: now })
          .where(eq(cities.id, existing.id));
        bucket.updated += 1;
        continue;
      }

      await this.db.insert(cities).values({
        id: createId(),
        country_id: country.id,
        name: def.name,
        region: def.region,
        created_at: now,
        updated_at: now,
      });
      bucket.inserted += 1;
    }
  }

  private async seedUnits(bucket: SeedBucketResult): Promise<void> {
    const now = nowMysqlDateTime();
    for (const def of SEED_UNITS) {
      const [existing] = await this.db
        .select({ id: units.id })
        .from(units)
        .where(eq(units.code, def.code))
        .limit(1);

      if (existing) {
        await this.db
          .update(units)
          .set({
            name: def.name,
            symbol: def.symbol,
            unit_type: def.unitType,
            updated_at: now,
          })
          .where(eq(units.id, existing.id));
        bucket.updated += 1;
        continue;
      }

      await this.db.insert(units).values({
        id: createId(),
        code: def.code,
        name: def.name,
        symbol: def.symbol,
        unit_type: def.unitType,
        created_at: now,
        updated_at: now,
      });
      bucket.inserted += 1;
    }
  }

  private async seedShippingTerms(bucket: SeedBucketResult): Promise<void> {
    const now = nowMysqlDateTime();
    for (const def of SEED_SHIPPING_TERMS) {
      const [existing] = await this.db
        .select({ id: shipping_terms.id })
        .from(shipping_terms)
        .where(eq(shipping_terms.code, def.code))
        .limit(1);

      if (existing) {
        await this.db
          .update(shipping_terms)
          .set({
            name: def.name,
            description: def.description,
            incoterm_version: def.incotermVersion,
            updated_at: now,
          })
          .where(eq(shipping_terms.id, existing.id));
        bucket.updated += 1;
        continue;
      }

      await this.db.insert(shipping_terms).values({
        id: createId(),
        code: def.code,
        name: def.name,
        description: def.description,
        incoterm_version: def.incotermVersion,
        created_at: now,
        updated_at: now,
      });
      bucket.inserted += 1;
    }
  }

  private async seedPaymentTerms(bucket: SeedBucketResult): Promise<void> {
    const now = nowMysqlDateTime();
    for (const def of SEED_PAYMENT_TERMS) {
      const [existing] = await this.db
        .select({ id: payment_terms.id })
        .from(payment_terms)
        .where(
          and(
            eq(payment_terms.code, def.code),
            isNull(payment_terms.organization_id),
            isNull(payment_terms.deleted_at),
          ),
        )
        .limit(1);

      if (existing) {
        await this.db
          .update(payment_terms)
          .set({
            name: def.name,
            days_due: def.daysDue,
            description: def.description,
            updated_at: now,
          })
          .where(eq(payment_terms.id, existing.id));
        bucket.updated += 1;
        continue;
      }

      await this.db.insert(payment_terms).values({
        id: createId(),
        organization_id: null,
        code: def.code,
        name: def.name,
        days_due: def.daysDue,
        description: def.description,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      });
      bucket.inserted += 1;
    }
  }

  private async seedTaxes(bucket: SeedBucketResult): Promise<void> {
    const now = nowMysqlDateTime();
    for (const def of SEED_TAXES) {
      const [country] = await this.db
        .select({ id: countries.id })
        .from(countries)
        .where(eq(countries.code, def.countryCode))
        .limit(1);

      const [existing] = await this.db
        .select({ id: taxes.id })
        .from(taxes)
        .where(
          and(
            eq(taxes.code, def.code),
            isNull(taxes.organization_id),
            isNull(taxes.deleted_at),
          ),
        )
        .limit(1);

      if (existing) {
        await this.db
          .update(taxes)
          .set({
            name: def.name,
            rate: def.rate,
            tax_type: def.taxType,
            country_id: country?.id ?? null,
            is_active: fromBool(true),
            updated_at: now,
          })
          .where(eq(taxes.id, existing.id));
        bucket.updated += 1;
        continue;
      }

      await this.db.insert(taxes).values({
        id: createId(),
        organization_id: null,
        code: def.code,
        name: def.name,
        rate: def.rate,
        tax_type: def.taxType,
        country_id: country?.id ?? null,
        is_active: fromBool(true),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      });
      bucket.inserted += 1;
    }
  }
}
