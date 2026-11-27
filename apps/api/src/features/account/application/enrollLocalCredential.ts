import { validateNewPassword } from '../domain/validateNewPassword.js';
import type { EnrollLocalCredentialDeps, EnrollLocalCredentialOutcome } from './ports.js';

interface EnrollLocalCredentialInput {
  accountId: string;
  sessionId: string;
  authMethod: 'local' | 'oidc';
  oidcAuthTime: Date | null;
  password: string;
}

export async function enrollLocalCredential(
  deps: EnrollLocalCredentialDeps,
  input: EnrollLocalCredentialInput,
): Promise<EnrollLocalCredentialOutcome> {
  if (!deps.enrollmentEnabled) return { ok: false, code: 'ERR_NOT_FOUND' };
  try {
    const age = input.oidcAuthTime ? deps.now().getTime() - input.oidcAuthTime.getTime() : NaN;
    // Lệch đồng hồ Authentik/API tối đa 60 giây (owner chốt 2026-11-27); auth_time xa hơn ở tương lai bị từ chối.
    if (input.authMethod !== 'oidc' || !Number.isFinite(age) || age > 300_000 || age < -60_000) {
      return { ok: false, code: 'ERR_FORBIDDEN' };
    }
    const account = await deps.enrollments.findAccount(input.accountId);
    if (!account) return { ok: false, code: 'ERR_UNAUTHENTICATED' };
    if (account.lockedAt !== null) return { ok: false, code: 'ERR_ACCOUNT_LOCKED' };
    if (account.oidcSubject === null) return { ok: false, code: 'ERR_FORBIDDEN' };
    if (!validateNewPassword(input.password, account.usernameNormalized ?? '')) {
      return { ok: false, code: 'ERR_VALIDATION', details: { field: 'password' } };
    }
    // Argon2 chạy ngoài transaction để không giữ khoá account trong lúc hash.
    const passwordHash = await deps.hasher.hash(input.password);
    const result = await deps.enrollments.insertIfAbsent({
      accountId: input.accountId,
      sessionId: input.sessionId,
      passwordHash,
      now: deps.now(),
    });
    if (result.ok) return { ok: true };
    const codes = {
      gone: 'ERR_UNAUTHENTICATED',
      locked: 'ERR_ACCOUNT_LOCKED',
      forbidden: 'ERR_FORBIDDEN',
      exists: 'ERR_CREDENTIAL_ALREADY_SET',
    } as const;
    return { ok: false, code: codes[result.reason] };
  } catch (error) {
    return {
      ok: false,
      code: 'ERR_AUTH_UNAVAILABLE',
      reason: error instanceof Error ? error.name : 'unknown',
    };
  }
}
