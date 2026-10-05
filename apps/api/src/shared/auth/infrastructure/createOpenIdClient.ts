import * as oidc from 'openid-client';
import type { OidcClient } from '../application/ports.js';
import { toIdentityClaims } from './toIdentityClaims.js';

export interface OidcSettings {
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

const SCOPE = 'openid email profile';

// Adapter Authentik qua openid-client (Code + PKCE S256 + nonce). Discovery lười và nhớ kết quả:
// Authentik tạm sự cố không làm API khởi động lỗi; lần discovery hỏng được thử lại ở lần đăng nhập sau.
export function createOpenIdClient(settings: OidcSettings): OidcClient {
  let configuration: Promise<oidc.Configuration> | undefined;
  const getConfiguration = () => {
    configuration ??= oidc
      .discovery(new URL(settings.issuerUrl), settings.clientId, settings.clientSecret)
      .catch((error: unknown) => {
        configuration = undefined;
        throw error;
      });
    return configuration;
  };

  return {
    async createAuthorizationRequest() {
      const config = await getConfiguration();
      const pending = {
        state: oidc.randomState(),
        codeVerifier: oidc.randomPKCECodeVerifier(),
        nonce: oidc.randomNonce(),
      };
      const url = oidc.buildAuthorizationUrl(config, {
        redirect_uri: settings.redirectUri,
        scope: SCOPE,
        code_challenge: await oidc.calculatePKCECodeChallenge(pending.codeVerifier),
        code_challenge_method: 'S256',
        state: pending.state,
        nonce: pending.nonce,
      });
      return { url, pending };
    },

    async exchangeCode(callbackParams, pending) {
      const config = await getConfiguration();
      // Dựng lại từ OIDC_REDIRECT_URI: sau Vite proxy/Caddy, URL request là địa chỉ nội bộ của API,
      // mà openid-client gửi chính URL này (bỏ query) làm redirect_uri lên token endpoint.
      const currentUrl = new URL(settings.redirectUri);
      callbackParams.forEach((value, key) => currentUrl.searchParams.append(key, value));
      const tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
        pkceCodeVerifier: pending.codeVerifier,
        expectedState: pending.state,
        expectedNonce: pending.nonce,
        idTokenExpected: true,
      });
      const claims = tokens.claims();
      if (!claims) {
        throw new Error('Authentik không trả id_token');
      }
      return toIdentityClaims(claims);
    },
  };
}
