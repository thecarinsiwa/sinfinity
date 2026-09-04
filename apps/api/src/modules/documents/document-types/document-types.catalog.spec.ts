import { SYSTEM_DOCUMENT_TYPES } from './document-types.catalog';

describe('document-types.catalog', () => {
  it('has unique system codes', () => {
    const codes = SYSTEM_DOCUMENT_TYPES.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('includes ROADMAP core codes', () => {
    const codes = new Set(SYSTEM_DOCUMENT_TYPES.map((t) => t.code));
    for (const code of ['QUOTE', 'INVOICE', 'BL', 'CONTRACT', 'PO', 'OTHER']) {
      expect(codes.has(code)).toBe(true);
    }
  });

  it('defines allowed mime types for each system type', () => {
    for (const def of SYSTEM_DOCUMENT_TYPES) {
      expect(def.allowedMimeTypes.length).toBeGreaterThan(0);
      expect(def.allowedMimeTypes).toContain('application/pdf');
    }
  });
});
