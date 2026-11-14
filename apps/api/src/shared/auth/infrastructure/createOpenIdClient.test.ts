import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as oidc from 'openid-client';
import { createOpenIdClient } from './createOpenIdClient.js';

vi.mock('openid-client', async (importOriginal) => {
  const original = await importOriginal<typeof oidc>();
  return {
    ...original,
    discovery: vi.fn(
      async () =>
        new original.Configuration(
          {
            issuer: 'https://issuer.test',
            authorization_endpoint: 'https://issuer.test/authorize',
            token_endpoint: 'https://issuer.test/token',
          },
          'client',
        ),
    ),
    authorizationCodeGrant: vi.fn(),
  };
});
const settings = {
  issuerUrl: 'https://issuer.test',
  clientId: 'client',
  clientSecret: 'secret',
  redirectUri: 'https://angia.test/api/auth/callback',
};
describe('Adapter OIDC reauth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it.each([true, false])(
    'TC-900: reauth=%s giữ PKCE/state/nonce và chỉ thêm max_age khi yêu cầu',
    async (reauth) => {
      const client = createOpenIdClient(settings);
      const { url, pending } = await client.createAuthorizationRequest({ reauth });
      expect(url.searchParams.get('max_age')).toBe(reauth ? '0' : null);
      expect(pending.maxAge).toBe(reauth ? 0 : undefined);
      expect(url.searchParams.get('state')).toBe(pending.state);
      expect(url.searchParams.get('nonce')).toBe(pending.nonce);
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
      expect(url.searchParams.get('code_challenge')).toBe(
        await oidc.calculatePKCECodeChallenge(pending.codeVerifier),
      );
    },
  );
  it.each([true, false])(
    'TC-900: callback reauth=%s chuyển maxAge cho thư viện kiểm auth_time',
    async (reauth) => {
      vi.mocked(oidc.authorizationCodeGrant).mockResolvedValue({
        claims: () => ({ sub: 'sub', auth_time: 1794614400 }),
      } as Awaited<ReturnType<typeof oidc.authorizationCodeGrant>>);
      const client = createOpenIdClient(settings);
      const { pending } = await client.createAuthorizationRequest({ reauth });
      const claims = await client.exchangeCode(
        new URLSearchParams({ code: 'code', state: pending.state }),
        pending,
      );
      const checks = vi.mocked(oidc.authorizationCodeGrant).mock.calls[0]![2];
      expect(checks).toEqual({
        pkceCodeVerifier: pending.codeVerifier,
        expectedState: pending.state,
        expectedNonce: pending.nonce,
        idTokenExpected: true,
        ...(reauth ? { maxAge: 0 } : {}),
      });
      expect(claims.authTime).toEqual(new Date(1794614400000));
    },
  );
  it('TC-901: thư viện từ chối auth_time không được bỏ qua lỗi', async () => {
    vi.mocked(oidc.authorizationCodeGrant).mockRejectedValue(new Error('auth_time'));
    const client = createOpenIdClient(settings);
    const { pending } = await client.createAuthorizationRequest({ reauth: true });
    await expect(client.exchangeCode(new URLSearchParams(), pending)).rejects.toThrow('auth_time');
  });
});
