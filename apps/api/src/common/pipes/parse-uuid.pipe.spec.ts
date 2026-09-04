import { BadRequestException } from '@nestjs/common';
import type { ArgumentMetadata } from '@nestjs/common';
import { ParseUUIDPipe } from './parse-uuid.pipe';

const metadata: ArgumentMetadata = {
  type: 'param',
  data: 'id',
  metatype: String,
};

describe('ParseUUIDPipe', () => {
  const pipe = new ParseUUIDPipe();

  it('accepts a UUID v4', () => {
    expect(
      pipe.transform('550e8400-e29b-41d4-a716-446655440000', metadata),
    ).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('accepts a UUID v7-shaped value', () => {
    expect(
      pipe.transform('0191e6b8-4c3a-7b2d-9f1e-2a3b4c5d6e7f', metadata),
    ).toBe('0191e6b8-4c3a-7b2d-9f1e-2a3b4c5d6e7f');
  });

  it('rejects an invalid value', () => {
    expect(() => pipe.transform('not-a-uuid', metadata)).toThrow(
      BadRequestException,
    );
  });

  it('allows empty when optional', () => {
    const optionalPipe = new ParseUUIDPipe({ optional: true });
    expect(optionalPipe.transform('', metadata)).toBeUndefined();
  });
});
