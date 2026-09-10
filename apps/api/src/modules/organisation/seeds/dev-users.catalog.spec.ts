import {
  SEED_DEV_BRANCHES,
  SEED_DEV_ORG,
  SEED_DEV_PASSWORD_DEFAULT,
  SEED_DEV_USERS,
} from './dev-users.catalog';

describe('dev-users.catalog', () => {
  it('defines an admin account and one user per system role family', () => {
    expect(SEED_DEV_ORG.name).toBe('Sinfinity SARL');
    expect(SEED_DEV_PASSWORD_DEFAULT.length).toBeGreaterThanOrEqual(8);
    expect(SEED_DEV_BRANCHES.map((b) => b.code)).toEqual(
      expect.arrayContaining(['HQ-KIN', 'WH-KIN']),
    );
    expect(SEED_DEV_USERS.map((u) => u.email)).toEqual(
      expect.arrayContaining(['admin@sinfinity.cd']),
    );
    expect(SEED_DEV_USERS.map((u) => u.roleCode)).toEqual(
      expect.arrayContaining([
        'ADMIN',
        'SALES',
        'PROCUREMENT',
        'LOGISTICS',
        'TECHNICAL',
        'FINANCE',
      ]),
    );
  });
});
