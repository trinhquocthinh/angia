import { randomBytes } from 'node:crypto';
import { identitySpikeError } from './identitySpikeError.js';

interface RoundProvider {
  createUser(username: string, password: string): Promise<{ pk: number; uid: string }>;
  verifyPassword(username: string, password: string): Promise<string>;
  setPassword(id: number, password: string): Promise<void>;
  lock(id: number): Promise<void>;
  unlock(id: number): Promise<void>;
  deleteUser(id: number): Promise<void>;
}
export interface IdentityRoundResult {
  round: number;
  username: string;
  success: boolean;
  deleted: boolean;
  failedStep: string | null;
  error: string | null;
  cleanupError: string | null;
  timings: Record<string, number>;
}
type Measure = <T>(step: string, operation: () => Promise<T>) => Promise<T>;

async function expectRejected(operation: () => Promise<unknown>, expected: string) {
  try {
    await operation();
  } catch (error) {
    if (error instanceof Error && error.message === expected) return;
    throw error;
  }
  throw new Error('idp_expected_rejection');
}

async function exerciseUser(
  provider: RoundProvider,
  username: string,
  password: string,
  user: { pk: number; uid: string },
  measure: Measure,
) {
  const nextPassword = `Aa1!${randomBytes(24).toString('base64url')}`;
  const login = async (value: string) => {
    if ((await provider.verifyPassword(username, value)) !== user.uid)
      throw new Error('idp_identity_mismatch');
  };
  await measure('login', () => login(password));
  await measure('setPassword', () => provider.setPassword(user.pk, nextPassword));
  await measure('loginAfterChange', () => login(nextPassword));
  await measure('oldPasswordDenied', () => expectRejected(() => login(password), 'idp_invalid_credentials'));
  await measure('lock', () => provider.lock(user.pk));
  await measure('lockedLoginDenied', () => expectRejected(() => login(nextPassword), 'ERR_ACCOUNT_LOCKED'));
  await measure('unlock', () => provider.unlock(user.pk));
  await measure('loginAfterUnlock', () => login(nextPassword));
}

export async function runIdentityRound(
  provider: RoundProvider,
  round: number,
  username: string,
  stopReason: () => string | null = () => null,
): Promise<IdentityRoundResult> {
  const row: IdentityRoundResult = {
    round,
    username,
    success: false,
    deleted: false,
    failedStep: null,
    error: null,
    cleanupError: null,
    timings: {},
  };
  let currentStep = 'createUser';
  const measure: Measure = async (step, operation) => {
    currentStep = step;
    const stopped = step === 'deleteUser' ? null : stopReason();
    if (stopped) throw new Error(stopped);
    const started = performance.now();
    try {
      return await operation();
    } finally {
      row.timings[step] = performance.now() - started;
    }
  };
  let id: number | undefined;
  try {
    const password = `Aa1!${randomBytes(24).toString('base64url')}`;
    const user = await measure('createUser', () => provider.createUser(username, password));
    id = user.pk;
    await exerciseUser(provider, username, password, user, measure);
    row.success = true;
  } catch (error) {
    row.failedStep = currentStep;
    row.error = identitySpikeError(error);
  } finally {
    if (id !== undefined) {
      const userId = id;
      try {
        await measure('deleteUser', () => provider.deleteUser(userId));
        row.deleted = true;
      } catch (error) {
        row.cleanupError = identitySpikeError(error);
      }
    }
  }
  row.success &&= row.deleted;
  return row;
}
