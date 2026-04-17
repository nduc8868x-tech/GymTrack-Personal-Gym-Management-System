import { hashPassword, comparePassword } from '../../src/utils/password';

describe('password utils', () => {
  const plainPassword = 'MySecureP@ss123';

  describe('hashPassword', () => {
    it('should return a bcrypt hash string', async () => {
      const hash = await hashPassword(plainPassword);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(plainPassword);
      expect(hash.startsWith('$2b$')).toBe(true);
    });

    it('should produce different hashes for same input (random salt)', async () => {
      const hash1 = await hashPassword(plainPassword);
      const hash2 = await hashPassword(plainPassword);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const hash = await hashPassword(plainPassword);
      const result = await comparePassword(plainPassword, hash);
      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      const hash = await hashPassword(plainPassword);
      const result = await comparePassword('wrongPassword', hash);
      expect(result).toBe(false);
    });

    it('should return false for empty password', async () => {
      const hash = await hashPassword(plainPassword);
      const result = await comparePassword('', hash);
      expect(result).toBe(false);
    });
  });
});
