import { createId } from './create-id';

const UUID_V7_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('createId', () => {
  it('returns a UUID v7', () => {
    const id = createId();
    expect(id).toMatch(UUID_V7_REGEX);
  });

  it('returns unique values', () => {
    expect(createId()).not.toBe(createId());
  });
});
