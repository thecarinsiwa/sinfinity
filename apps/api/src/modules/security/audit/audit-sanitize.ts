const SENSITIVE_KEY =
  /password|passwd|secret|token|authorization|cookie|refresh/i;

/** Deep-clone payload for audit storage; redact sensitive keys. */
export function sanitizeAuditPayload(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value ?? null;
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditPayload(item));
  }

  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  for (const [key, nested] of Object.entries(input)) {
    if (SENSITIVE_KEY.test(key)) {
      output[key] = '[redacted]';
      continue;
    }
    output[key] = sanitizeAuditPayload(nested);
  }

  return output;
}
