import { SWAGGER_TAG, SWAGGER_TAG_DEFINITIONS } from './swagger-tags';

describe('swagger-tags', () => {
  it('defines Phase 0–9 tags in stable order', () => {
    expect(SWAGGER_TAG_DEFINITIONS.map((tag) => tag.name)).toEqual([
      SWAGGER_TAG.Health,
      SWAGGER_TAG.Settings,
      SWAGGER_TAG.Auth,
      SWAGGER_TAG.Organisation,
      SWAGGER_TAG.Securite,
      SWAGGER_TAG.Documents,
      SWAGGER_TAG.Catalogue,
      SWAGGER_TAG.Crm,
      SWAGGER_TAG.Fournisseurs,
      SWAGGER_TAG.Devis,
      SWAGGER_TAG.CommandesClients,
      SWAGGER_TAG.Sourcing,
    ]);
  });

  it('uses the accented Sécurité name expected by ROADMAP', () => {
    expect(SWAGGER_TAG.Securite).toBe('Sécurité');
  });

  it('uses the Catalogue tag name expected by ROADMAP', () => {
    expect(SWAGGER_TAG.Catalogue).toBe('Catalogue');
  });

  it('uses the CRM tag name expected by ROADMAP', () => {
    expect(SWAGGER_TAG.Crm).toBe('CRM');
  });

  it('uses the Fournisseurs tag name expected by ROADMAP', () => {
    expect(SWAGGER_TAG.Fournisseurs).toBe('Fournisseurs');
  });

  it('uses the Devis tag name expected by ROADMAP', () => {
    expect(SWAGGER_TAG.Devis).toBe('Devis');
  });

  it('uses the Commandes clients tag name expected by ROADMAP', () => {
    expect(SWAGGER_TAG.CommandesClients).toBe('Commandes clients');
  });

  it('uses the Sourcing tag name expected by ROADMAP', () => {
    expect(SWAGGER_TAG.Sourcing).toBe('Sourcing');
  });

  it('has unique tag names', () => {
    const names = SWAGGER_TAG_DEFINITIONS.map((tag) => tag.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
