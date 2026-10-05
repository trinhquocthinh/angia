import { computeSessionExpiry } from '../domain/computeSessionExpiry.js';
import { resolveDisplayName } from '../domain/resolveDisplayName.js';
import type { CompleteLoginDeps, PendingLogin } from './ports.js';

export interface CompletedLogin {
  sessionId: string;
  expiresAt: Date;
}

// Bước callback của Sequence §1: đổi code → upsert accounts (đồng bộ is_system_admin) → tạo phiên.
export async function completeLogin(
  deps: CompleteLoginDeps,
  callbackParams: URLSearchParams,
  pending: PendingLogin,
): Promise<CompletedLogin> {
  const claims = await deps.oidc.exchangeCode(callbackParams, pending);
  const account = await deps.accounts.upsertFromIdentity({
    oidcSubject: claims.subject,
    displayName: resolveDisplayName(claims),
    isSystemAdmin: claims.groups.includes(deps.adminGroupName),
  });
  const expiresAt = computeSessionExpiry(deps.now());
  const session = await deps.sessions.create({
    accountId: account.id,
    csrfToken: deps.generateToken(),
    expiresAt,
  });
  return { sessionId: session.id, expiresAt };
}
