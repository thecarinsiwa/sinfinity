import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readPackageVersion } from './package-version';

describe('readPackageVersion', () => {
  const originalCwd = process.cwd();

  afterEach(() => {
    process.chdir(originalCwd);
  });

  it('reads version from cwd package.json (dist-safe)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sinfinity-pkg-'));
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: '@sinfinity/api', version: '1.2.3' }),
    );
    process.chdir(dir);

    expect(readPackageVersion()).toBe('1.2.3');
  });
});
