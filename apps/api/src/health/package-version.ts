import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Resolve apps/api/package.json from both `src/` (ts-node) and `dist/src/` layouts.
 */
export function readPackageVersion(): string {
  const candidates = [
    join(process.cwd(), 'package.json'),
    join(__dirname, '..', '..', 'package.json'),
    join(__dirname, '..', '..', '..', 'package.json'),
  ];

  for (const packageJsonPath of candidates) {
    if (!existsSync(packageJsonPath)) {
      continue;
    }
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      version?: string;
      name?: string;
    };
    // Prefer the API package, skip monorepo root if cwd is wrong.
    if (pkg.name && pkg.name !== '@sinfinity/api' && pkg.version == null) {
      continue;
    }
    if (typeof pkg.version === 'string') {
      return pkg.version;
    }
  }

  return '0.0.0';
}
