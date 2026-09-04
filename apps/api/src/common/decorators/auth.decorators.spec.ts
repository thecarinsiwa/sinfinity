import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import type { AuthUser } from '../types/auth-user.type';
import { CurrentUser } from './current-user.decorator';
import { OrganizationId } from './organization-id.decorator';

function getParamDecoratorFactory(
  decorator: (...args: never[]) => ParameterDecorator,
): (data: unknown, ctx: ExecutionContext) => unknown {
  class Test {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public handler(@decorator() _value: unknown) {}
  }

  const args = ROUTE_ARGS_METADATA;
  const metadata = Reflect.getMetadata(args, Test, 'handler') as Record<
    string,
    { factory: (data: unknown, ctx: ExecutionContext) => unknown }
  >;
  const key = Object.keys(metadata)[0];
  return metadata[key].factory;
}

function createContext(user?: AuthUser): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('auth param decorators', () => {
  const user: AuthUser = {
    id: 'user-1',
    organizationId: 'org-1',
    email: 'a@b.c',
  };

  it('CurrentUser returns the full user', () => {
    const factory = getParamDecoratorFactory(CurrentUser as never);
    expect(factory(undefined, createContext(user))).toEqual(user);
  });

  it('CurrentUser returns a property when requested', () => {
    const factory = getParamDecoratorFactory(CurrentUser as never);
    expect(factory('id', createContext(user))).toBe('user-1');
  });

  it('CurrentUser returns undefined without auth', () => {
    const factory = getParamDecoratorFactory(CurrentUser as never);
    expect(factory(undefined, createContext())).toBeUndefined();
  });

  it('OrganizationId returns organizationId', () => {
    const factory = getParamDecoratorFactory(OrganizationId);
    expect(factory(undefined, createContext(user))).toBe('org-1');
  });

  it('OrganizationId returns undefined without auth', () => {
    const factory = getParamDecoratorFactory(OrganizationId);
    expect(factory(undefined, createContext())).toBeUndefined();
  });
});
