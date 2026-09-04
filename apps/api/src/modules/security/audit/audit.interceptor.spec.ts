import { of } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from './audit.service';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let auditService: { write: jest.Mock };
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    auditService = { write: jest.fn().mockResolvedValue(undefined) };
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    interceptor = new AuditInterceptor(
      auditService as unknown as AuditService,
      reflector as never,
    );
  });

  function httpContext(request: Record<string, unknown>) {
    return {
      getType: () => 'http',
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    };
  }

  it('ignores GET requests', (done) => {
    const ctx = httpContext({
      method: 'GET',
      path: '/api/v1/users',
      url: '/api/v1/users',
    });

    interceptor.intercept(ctx as never, { handle: () => of({ ok: true }) }).subscribe({
      complete: () => {
        expect(auditService.write).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('skips auth paths', (done) => {
    const ctx = httpContext({
      method: 'POST',
      path: '/api/v1/auth/login',
      url: '/api/v1/auth/login',
      params: {},
      body: { email: 'a@b.co', password: 'x' },
      headers: {},
    });

    interceptor.intercept(ctx as never, { handle: () => of({ accessToken: 't' }) }).subscribe({
      complete: () => {
        expect(auditService.write).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('writes create audit on successful POST', (done) => {
    const ctx = httpContext({
      method: 'POST',
      path: '/api/v1/users',
      url: '/api/v1/users',
      params: {},
      body: { email: 'a@b.co', password: 'secret' },
      headers: {},
      ip: '127.0.0.1',
      user: {
        id: 'user-1',
        organizationId: 'org-1',
      },
    });

    interceptor
      .intercept(ctx as never, {
        handle: () => of({ id: 'user-2', email: 'a@b.co' }),
      })
      .subscribe({
        complete: () => {
          setImmediate(() => {
            expect(auditService.write).toHaveBeenCalledWith(
              expect.objectContaining({
                action: 'create',
                entityType: 'users',
                entityId: 'user-2',
                organizationId: 'org-1',
                userId: 'user-1',
                newValues: expect.objectContaining({
                  email: 'a@b.co',
                }),
              }),
            );
            done();
          });
        },
      });
  });
});
