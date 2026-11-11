import { randomBytes } from 'node:crypto';

interface SpikeProvider {
  createUser(username: string, password: string): Promise<{ pk: number; uid: string }>;
  verifyPassword(username: string, password: string): Promise<string>;
  deleteUser(id: number): Promise<void>;
}

export async function runIdentityProviderSpike(provider: SpikeProvider, username: string) {
  const password = `Aa1!${randomBytes(24).toString('base64url')}`;
  const user = await provider.createUser(username, password);
  const cleanup = () =>
    provider.deleteUser(user.pk).catch(() => {
      throw new Error('idp_cleanup_failed');
    });
  let verifyPasswordMs: number;
  try {
    const started = performance.now();
    const uid = await provider.verifyPassword(username, password);
    verifyPasswordMs = performance.now() - started;
    if (uid !== user.uid) throw new Error('idp_identity_mismatch');
    let rejected = false;
    try {
      await provider.verifyPassword(username, `${password}-wrong`);
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'idp_invalid_credentials') throw error;
      rejected = true;
    }
    if (!rejected) throw new Error('idp_wrong_password_accepted');
  } finally {
    await cleanup();
  }
  return { passwordVerified: true, wrongPasswordRejected: true, deleted: true, verifyPasswordMs };
}
