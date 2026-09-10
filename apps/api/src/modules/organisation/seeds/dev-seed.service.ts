import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq, isNull } from 'drizzle-orm';
import { createId } from '../../../common';
import type { Env } from '../../../config/env.validation';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import {
  branches,
  cities,
  countries,
  currencies,
  organizations,
  roles,
  user_roles,
  users,
} from '../../../database/schema';
import { PasswordService } from '../../auth/password.service';
import { RbacSeedService } from '../../security/rbac/rbac-seed.service';
import { SettingsSeedService } from '../../settings/seeds/settings-seed.service';
import {
  fromBool,
  nowMysqlDateTime,
} from '../../settings/utils/mysql-datetime';
import {
  SEED_DEV_BRANCHES,
  SEED_DEV_ORG,
  SEED_DEV_PASSWORD_DEFAULT,
  SEED_DEV_USERS,
} from './dev-users.catalog';

export type DevSeedResult = {
  organizationId: string;
  organizationCreated: boolean;
  branchesInserted: number;
  branchesExisting: number;
  usersInserted: number;
  usersExisting: number;
  userRolesAssigned: number;
  passwordSource: 'env' | 'default';
  accounts: Array<{ email: string; roleCode: string }>;
};

@Injectable()
export class DevSeedService {
  private readonly logger = new Logger(DevSeedService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly passwords: PasswordService,
    private readonly settingsSeed: SettingsSeedService,
    private readonly rbacSeed: RbacSeedService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /**
   * Idempotent local bootstrap: settings + RBAC + org + branches + demo users.
   * Refuses to run outside development/test.
   */
  async seed(): Promise<DevSeedResult> {
    this.assertDevEnvironment();

    await this.settingsSeed.seed();
    await this.rbacSeed.seed();

    const { password, passwordSource } = this.resolvePassword();
    const passwordHash = await this.passwords.hash(password);

    const currencyId = await this.requireCurrencyId(
      SEED_DEV_ORG.defaultCurrencyCode,
    );
    const countryId = await this.requireCountryId(SEED_DEV_ORG.countryCode);
    const cityId = await this.requireCityId(
      countryId,
      'Kinshasa',
      'Kinshasa',
    );

    const { organizationId, created: organizationCreated } =
      await this.ensureOrganization(currencyId, countryId);

    let branchesInserted = 0;
    let branchesExisting = 0;
    const branchIdByCode = new Map<string, string>();

    for (const def of SEED_DEV_BRANCHES) {
      const ensured = await this.ensureBranch(
        organizationId,
        def,
        cityId,
      );
      branchIdByCode.set(def.code, ensured.id);
      if (ensured.created) {
        branchesInserted += 1;
      } else {
        branchesExisting += 1;
      }
    }

    const roleIdByCode = await this.loadSystemRoleIds();

    let usersInserted = 0;
    let usersExisting = 0;
    let userRolesAssigned = 0;
    const accounts: Array<{ email: string; roleCode: string }> = [];

    for (const def of SEED_DEV_USERS) {
      const roleId = roleIdByCode.get(def.roleCode);
      if (!roleId) {
        throw new ServiceUnavailableException(
          `System role ${def.roleCode} missing after RBAC seed`,
        );
      }

      const branchId = branchIdByCode.get(def.branchCode) ?? null;
      const ensured = await this.ensureUser(
        organizationId,
        branchId,
        def,
        passwordHash,
      );
      if (ensured.created) {
        usersInserted += 1;
      } else {
        usersExisting += 1;
        // Keep password in sync on re-seed so local login stays predictable
        await this.db
          .update(users)
          .set({
            password_hash: passwordHash,
            first_name: def.firstName,
            last_name: def.lastName,
            phone: def.phone,
            branch_id: branchId,
            is_active: fromBool(true),
            updated_at: nowMysqlDateTime(),
            deleted_at: null,
          })
          .where(eq(users.id, ensured.id));
      }

      const assigned = await this.ensureUserRole(ensured.id, roleId, null);
      if (assigned) {
        userRolesAssigned += 1;
      }

      accounts.push({ email: def.email, roleCode: def.roleCode });
    }

    const result: DevSeedResult = {
      organizationId,
      organizationCreated,
      branchesInserted,
      branchesExisting,
      usersInserted,
      usersExisting,
      userRolesAssigned,
      passwordSource,
      accounts,
    };

    this.logger.log(
      `Dev seed done: org=${organizationId} users+${usersInserted}/~${usersExisting} roles+${userRolesAssigned}`,
    );
    return result;
  }

  private assertDevEnvironment(): void {
    const nodeEnv = this.config.get('NODE_ENV', { infer: true });
    if (nodeEnv !== 'development' && nodeEnv !== 'test') {
      throw new ServiceUnavailableException(
        'Dev seed is only allowed when NODE_ENV is development or test',
      );
    }
  }

  private resolvePassword(): {
    password: string;
    passwordSource: 'env' | 'default';
  } {
    const fromEnv = process.env.SEED_DEV_PASSWORD?.trim();
    if (fromEnv && fromEnv.length >= 8) {
      return { password: fromEnv, passwordSource: 'env' };
    }
    return {
      password: SEED_DEV_PASSWORD_DEFAULT,
      passwordSource: 'default',
    };
  }

  private async requireCurrencyId(code: string): Promise<string> {
    const [row] = await this.db
      .select({ id: currencies.id })
      .from(currencies)
      .where(eq(currencies.code, code))
      .limit(1);
    if (!row) {
      throw new ServiceUnavailableException(
        `Currency ${code} missing — run seed:settings first`,
      );
    }
    return row.id;
  }

  private async requireCountryId(code: string): Promise<string> {
    const [row] = await this.db
      .select({ id: countries.id })
      .from(countries)
      .where(eq(countries.code, code))
      .limit(1);
    if (!row) {
      throw new ServiceUnavailableException(
        `Country ${code} missing — run seed:settings first`,
      );
    }
    return row.id;
  }

  private async requireCityId(
    countryId: string,
    name: string,
    region: string,
  ): Promise<string> {
    const [row] = await this.db
      .select({ id: cities.id })
      .from(cities)
      .where(
        and(
          eq(cities.country_id, countryId),
          eq(cities.name, name),
          eq(cities.region, region),
        ),
      )
      .limit(1);
    if (!row) {
      throw new ServiceUnavailableException(
        `City ${name}/${region} missing — run seed:settings first`,
      );
    }
    return row.id;
  }

  private async ensureOrganization(
    currencyId: string,
    countryId: string,
  ): Promise<{ organizationId: string; created: boolean }> {
    const [existing] = await this.db
      .select({ id: organizations.id })
      .from(organizations)
      .where(
        and(
          eq(organizations.name, SEED_DEV_ORG.name),
          isNull(organizations.deleted_at),
        ),
      )
      .limit(1);

    if (existing) {
      await this.db
        .update(organizations)
        .set({
          legal_name: SEED_DEV_ORG.legalName,
          tax_id: SEED_DEV_ORG.taxId,
          email: SEED_DEV_ORG.email,
          phone: SEED_DEV_ORG.phone,
          website: SEED_DEV_ORG.website,
          default_currency_id: currencyId,
          country_id: countryId,
          is_active: fromBool(true),
          updated_at: nowMysqlDateTime(),
        })
        .where(eq(organizations.id, existing.id));
      return { organizationId: existing.id, created: false };
    }

    const id = createId();
    await this.db.insert(organizations).values({
      id,
      name: SEED_DEV_ORG.name,
      legal_name: SEED_DEV_ORG.legalName,
      tax_id: SEED_DEV_ORG.taxId,
      email: SEED_DEV_ORG.email,
      phone: SEED_DEV_ORG.phone,
      website: SEED_DEV_ORG.website,
      default_currency_id: currencyId,
      country_id: countryId,
      is_active: fromBool(true),
    });
    return { organizationId: id, created: true };
  }

  private async ensureBranch(
    organizationId: string,
    def: (typeof SEED_DEV_BRANCHES)[number],
    cityId: string,
  ): Promise<{ id: string; created: boolean }> {
    const [existing] = await this.db
      .select({ id: branches.id })
      .from(branches)
      .where(
        and(
          eq(branches.organization_id, organizationId),
          eq(branches.code, def.code),
          isNull(branches.deleted_at),
        ),
      )
      .limit(1);

    if (existing) {
      await this.db
        .update(branches)
        .set({
          name: def.name,
          type: def.type,
          phone: def.phone,
          city_id: cityId,
          is_active: fromBool(true),
          updated_at: nowMysqlDateTime(),
        })
        .where(eq(branches.id, existing.id));
      return { id: existing.id, created: false };
    }

    const id = createId();
    await this.db.insert(branches).values({
      id,
      organization_id: organizationId,
      code: def.code,
      name: def.name,
      type: def.type,
      phone: def.phone,
      city_id: cityId,
      is_active: fromBool(true),
    });
    return { id, created: true };
  }

  private async loadSystemRoleIds(): Promise<Map<string, string>> {
    const rows = await this.db
      .select({ id: roles.id, code: roles.code })
      .from(roles)
      .where(
        and(
          isNull(roles.organization_id),
          eq(roles.is_system, 1),
          isNull(roles.deleted_at),
        ),
      );

    return new Map(rows.map((row) => [row.code, row.id]));
  }

  private async ensureUser(
    organizationId: string,
    branchId: string | null,
    def: (typeof SEED_DEV_USERS)[number],
    passwordHash: string,
  ): Promise<{ id: string; created: boolean }> {
    const email = def.email.trim().toLowerCase();
    const [existing] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return { id: existing.id, created: false };
    }

    const id = createId();
    await this.db.insert(users).values({
      id,
      organization_id: organizationId,
      branch_id: branchId,
      email,
      password_hash: passwordHash,
      first_name: def.firstName,
      last_name: def.lastName,
      phone: def.phone,
      is_active: fromBool(true),
      email_verified_at: nowMysqlDateTime(),
    });
    return { id, created: true };
  }

  private async ensureUserRole(
    userId: string,
    roleId: string,
    branchId: string | null,
  ): Promise<boolean> {
    const conditions = [
      eq(user_roles.user_id, userId),
      eq(user_roles.role_id, roleId),
    ];
    if (branchId) {
      conditions.push(eq(user_roles.branch_id, branchId));
    } else {
      conditions.push(isNull(user_roles.branch_id));
    }

    const [existing] = await this.db
      .select({ id: user_roles.id })
      .from(user_roles)
      .where(and(...conditions))
      .limit(1);

    if (existing) {
      return false;
    }

    await this.db.insert(user_roles).values({
      id: createId(),
      user_id: userId,
      role_id: roleId,
      branch_id: branchId,
    });
    return true;
  }
}
