import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function readPackageVersion(): string {
  const packageJsonPath = join(__dirname, '..', '..', 'package.json');
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    version: string;
  };
  return pkg.version;
}
