import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('always allows (stub until Phase 2 auth)', () => {
    expect(new JwtAuthGuard().canActivate()).toBe(true);
  });
});
