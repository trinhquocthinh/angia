import type { IdentityClaims } from '../domain/IdentityClaims.js';
import type { SessionContext } from '../domain/SessionContext.js';

// Bí mật một lần của luồng Authorization Code + PKCE, giữ ở cookie ký HttpOnly giữa /login và /callback.
export interface PendingLogin {
  state: string;
  codeVerifier: string;
  nonce: string;
}

interface AuthorizationRequest {
  url: URL;
  pending: PendingLogin;
}

export interface OidcClient {
  createAuthorizationRequest(): Promise<AuthorizationRequest>;
  // Kiểm state, đổi code (kèm code_verifier) lấy token và xác thực id_token; chỉ trả claim, token không rời adapter.
  exchangeCode(callbackParams: URLSearchParams, pending: PendingLogin): Promise<IdentityClaims>;
}

interface AccountIdentity {
  oidcSubject: string;
  displayName: string;
  isSystemAdmin: boolean;
}

export interface AccountRepository {
  // Upsert theo oidc_subject; không bao giờ chạm family_id/family_role (do Quản trị viên gán).
  upsertFromIdentity(identity: AccountIdentity): Promise<{ id: string }>;
}

interface NewSession {
  accountId: string;
  csrfToken: string;
  expiresAt: Date;
}

export interface SessionRepository {
  create(session: NewSession): Promise<{ id: string }>;
  // Phiên có expires_at > now kèm tài khoản và nhóm; hết hạn hoặc không tồn tại trả null.
  findActive(sessionId: string, now: Date): Promise<SessionContext | null>;
  extend(sessionId: string, expiresAt: Date): Promise<void>;
  delete(sessionId: string): Promise<void>;
}

export interface CompleteLoginDeps {
  oidc: OidcClient;
  accounts: AccountRepository;
  sessions: SessionRepository;
  adminGroupName: string;
  generateToken: () => string;
  now: () => Date;
}

export type ResolveSessionDeps = Pick<CompleteLoginDeps, 'sessions' | 'now'>;
