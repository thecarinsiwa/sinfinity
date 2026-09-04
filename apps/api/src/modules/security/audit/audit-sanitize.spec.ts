import { sanitizeAuditPayload } from './audit-sanitize';

describe('sanitizeAuditPayload', () => {
  it('redacts sensitive keys recursively', () => {
    const result = sanitizeAuditPayload({
      email: 'a@b.co',
      password: 'unit-test-only',
      nested: { refreshToken: 'abc', name: 'Ada' },
    });

    expect(result).toEqual({
      email: 'a@b.co',
      password: '[redacted]',
      nested: { refreshToken: '[redacted]', name: 'Ada' },
    });
  });

  it('handles arrays and primitives', () => {
    expect(sanitizeAuditPayload(['x', { token: 'y' }])).toEqual([
      'x',
      { token: '[redacted]' },
    ]);
    expect(sanitizeAuditPayload(null)).toBeNull();
    expect(sanitizeAuditPayload(12)).toBe(12);
  });
});
