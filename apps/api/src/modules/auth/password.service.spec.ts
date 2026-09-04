import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes and verifies with argon2id', async () => {
    const hash = await service.hash('ChangeMe123!');
    expect(hash.startsWith('$argon2')).toBe(true);
    await expect(service.verify(hash, 'ChangeMe123!')).resolves.toBe(true);
    await expect(service.verify(hash, 'wrong')).resolves.toBe(false);
  });
});
