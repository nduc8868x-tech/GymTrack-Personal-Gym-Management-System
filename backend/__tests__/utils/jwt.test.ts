import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../../src/utils/jwt';

describe('jwt utils', () => {
  const payload = { userId: 'user-123', email: 'test@example.com' };

  describe('access token', () => {
    it('should sign and verify an access token', () => {
      const token = signAccessToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should reject a tampered token', () => {
      const token = signAccessToken(payload);
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(() => verifyAccessToken(tampered)).toThrow();
    });

    it('should include iat and exp claims', () => {
      const token = signAccessToken(payload);
      const decoded = verifyAccessToken(token);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp!).toBeGreaterThan(decoded.iat!);
    });
  });

  describe('refresh token', () => {
    it('should sign and verify a refresh token', () => {
      const token = signRefreshToken(payload);
      expect(token).toBeDefined();

      const decoded = verifyRefreshToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should not verify refresh token with access secret', () => {
      const token = signRefreshToken(payload);
      expect(() => verifyAccessToken(token)).toThrow();
    });

    it('should not verify access token with refresh secret', () => {
      const token = signAccessToken(payload);
      expect(() => verifyRefreshToken(token)).toThrow();
    });
  });
});
