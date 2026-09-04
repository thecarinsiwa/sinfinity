import {
  PERMISSION_CATALOG,
  SYSTEM_ROLES,
  resolveRolePermissionCodes,
} from './permissions.catalog';

describe('permissions.catalog', () => {
  it('has unique permission codes', () => {
    const codes = PERMISSION_CATALOG.map((p) => p.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('includes Phase 2 permission codes', () => {
    const codes = new Set(PERMISSION_CATALOG.map((p) => p.code));
    for (const code of [
      'settings.read',
      'users.write',
      'roles.read',
      'roles.write',
      'audit.read',
      'system_settings.write',
      'quotations.approve',
    ]) {
      expect(codes.has(code)).toBe(true);
    }
  });

  it('gives ADMIN every catalog permission', () => {
    const admin = SYSTEM_ROLES.find((r) => r.code === 'ADMIN')!;
    expect(resolveRolePermissionCodes(admin)).toHaveLength(
      PERMISSION_CATALOG.length,
    );
  });

  it('gives SALES catalog.read and catalog.write', () => {
    const sales = SYSTEM_ROLES.find((r) => r.code === 'SALES')!;
    const codes = new Set(resolveRolePermissionCodes(sales));
    expect(codes.has('catalog.read')).toBe(true);
    expect(codes.has('catalog.write')).toBe(true);
  });

  it('gives SALES quotations.read/write/approve', () => {
    const sales = SYSTEM_ROLES.find((r) => r.code === 'SALES')!;
    const codes = new Set(resolveRolePermissionCodes(sales));
    expect(codes.has('quotations.read')).toBe(true);
    expect(codes.has('quotations.write')).toBe(true);
    expect(codes.has('quotations.approve')).toBe(true);
  });
});
