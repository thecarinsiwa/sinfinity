import { UNIT_TEST_PASSWORD } from '../../test-fixtures/passwords';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes and verifies with argon2id', async () => {
    const hash = await service.hash(UNIT_TEST_PASSWORD);
    expect(hash.startsWith('$argon2')).toBe(true);
    await expect(service.verify(hash, UNIT_TEST_PASSWORD)).resolves.toBe(true);
    await expect(service.verify(hash, 'wrong')).resolves.toBe(false);
  });
});
