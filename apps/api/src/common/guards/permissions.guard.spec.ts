import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser } from '../types/auth-user.type';
import { PermissionsGuard } from './permissions.guard';

function createContext(user?: AuthUser): ExecutionContext {
  return {
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  it('allows when no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows when user.permissions is absent (pre-auth stub)', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['settings.read']);
    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows when user has all required permissions', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['settings.read', 'settings.write']);
    expect(
      guard.canActivate(
        createContext({
          id: 'u1',
          organizationId: 'o1',
          permissions: ['settings.read', 'settings.write'],
        }),
      ),
    ).toBe(true);
  });

  it('forbids when user.permissions lacks a required code', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['settings.write']);
    expect(() =>
      guard.canActivate(
        createContext({
          id: 'u1',
          organizationId: 'o1',
          permissions: ['settings.read'],
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
