import { SWAGGER_TAG, SWAGGER_TAG_DEFINITIONS } from './swagger-tags';

describe('swagger-tags', () => {
  it('defines Phase 0–3 tags in stable order', () => {
    expect(SWAGGER_TAG_DEFINITIONS.map((tag) => tag.name)).toEqual([
      SWAGGER_TAG.Health,
      SWAGGER_TAG.Settings,
      SWAGGER_TAG.Auth,
      SWAGGER_TAG.Organisation,
      SWAGGER_TAG.Securite,
      SWAGGER_TAG.Documents,
    ]);
  });

  it('uses the accented Sécurité name expected by ROADMAP', () => {
    expect(SWAGGER_TAG.Securite).toBe('Sécurité');
  });

  it('has unique tag names', () => {
    const names = SWAGGER_TAG_DEFINITIONS.map((tag) => tag.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
