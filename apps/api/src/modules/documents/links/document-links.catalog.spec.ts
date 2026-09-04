import {
  DOCUMENT_LINK_ENTITY_TYPES,
  DOCUMENT_LINK_ROLES,
  isAllowedDocumentLinkEntityType,
  isAllowedDocumentLinkRole,
} from './document-links.catalog';

describe('document-links.catalog', () => {
  it('has unique entity types', () => {
    expect(new Set(DOCUMENT_LINK_ENTITY_TYPES).size).toBe(
      DOCUMENT_LINK_ENTITY_TYPES.length,
    );
  });

  it('includes core entity types from module docs', () => {
    for (const type of ['customer', 'sales_order', 'supplier'] as const) {
      expect(isAllowedDocumentLinkEntityType(type)).toBe(true);
    }
  });

  it('rejects unknown entity types', () => {
    expect(isAllowedDocumentLinkEntityType('unknown_thing')).toBe(false);
    expect(isAllowedDocumentLinkEntityType('')).toBe(false);
  });

  it('allows documented roles', () => {
    for (const role of DOCUMENT_LINK_ROLES) {
      expect(isAllowedDocumentLinkRole(role)).toBe(true);
    }
    expect(isAllowedDocumentLinkRole('other')).toBe(false);
  });
});
