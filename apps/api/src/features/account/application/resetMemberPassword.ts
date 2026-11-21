import { randomInt } from 'node:crypto';
import { validateNewPassword } from '../domain/validateNewPassword.js';
import type {
  MemberPasswordResetActor,
  ResetMemberPasswordDeps,
  ResetMemberPasswordOutcome,
} from './ports.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export async function resetMemberPassword(
  deps: ResetMemberPasswordDeps,
  actor: MemberPasswordResetActor,
  targetAccountId: string,
): Promise<ResetMemberPasswordOutcome> {
  if (!actor.familyId || actor.role !== 'main' || actor.accountId === targetAccountId)
    return { ok: false, code: 'ERR_FORBIDDEN' };
  const scopedActor = { ...actor, familyId: actor.familyId };
  try {
    const permission = await deps.memberPasswordResets.authorize(scopedActor, targetAccountId);
    if (!permission.ok) return permission;
    let temporaryPassword: string;
    do {
      temporaryPassword = Array.from({ length: 20 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
    } while (!validateNewPassword(temporaryPassword, permission.usernameNormalized ?? ''));
    // Argon2 chạy ngoài transaction; repository khoá và kiểm quyền lại sau khi hash.
    const passwordHash = await deps.hasher.hash(temporaryPassword);
    const now = deps.now();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const result = await deps.memberPasswordResets.reset(scopedActor, targetAccountId, {
      passwordHash,
      now,
      expiresAt,
    });
    if (!result.ok) return result;
    return { ok: true, value: { temporaryPassword, expiresAt } };
  } catch (error) {
    return {
      ok: false,
      code: 'ERR_AUTH_UNAVAILABLE',
      reason: error instanceof Error ? error.name : 'unknown',
    };
  }
}
