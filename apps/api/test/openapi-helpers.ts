import { SWAGGER_BEARER_AUTH } from '../src/config/constants';
import type { SwaggerTagName } from '../src/config/swagger-tags';

export type OpenApiOperation = {
  tags?: string[];
  security?: Array<Record<string, unknown[]>>;
  responses?: Record<string, { description?: string; content?: unknown }>;
};

export type OpenApiPathItem = Record<string, OpenApiOperation | undefined>;

export type OpenApiDocument = {
  tags?: { name: string; description?: string }[];
  paths: Record<string, OpenApiPathItem>;
  components?: {
    securitySchemes?: Record<string, { type: string; scheme: string }>;
    schemas?: Record<string, unknown>;
  };
};

/** Assert POST (or other) documents a success status and not HTTP 501. */
export function expectImplementedResponse(
  pathItem: OpenApiPathItem | undefined,
  method: string,
  successStatus: string,
): void {
  expect(pathItem).toBeDefined();
  const operation = pathItem?.[method];
  expect(operation).toBeDefined();
  expect(operation?.responses?.[successStatus]).toBeDefined();
  expect(operation?.responses?.['501']).toBeUndefined();
}

export function expectTaggedOperation(
  pathItem: OpenApiPathItem | undefined,
  method: string,
  tag: SwaggerTagName,
  options?: { bearer?: boolean },
): void {
  expect(pathItem).toBeDefined();
  const operation = pathItem?.[method];
  expect(operation).toBeDefined();
  expect(operation?.tags).toContain(tag);

  const requireBearer = options?.bearer !== false;
  if (requireBearer) {
    expect(operation?.security).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          [SWAGGER_BEARER_AUTH]: expect.any(Array),
        }),
      ]),
    );
    return;
  }

  const hasBearer = operation?.security?.some(
    (entry) => entry[SWAGGER_BEARER_AUTH] !== undefined,
  );
  expect(hasBearer).toBeFalsy();
}

export function expectTagDefined(
  document: OpenApiDocument,
  tag: SwaggerTagName,
): void {
  expect(document.tags?.some((entry) => entry.name === tag)).toBe(true);
}
