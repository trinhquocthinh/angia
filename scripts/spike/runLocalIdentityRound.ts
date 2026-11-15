import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import type pg from 'pg';
import type { Database } from '../../apps/api/src/shared/db/createDatabase.js';
import { accounts } from '../../apps/api/src/shared/db/schema/accounts.js';
import type {
  IdentityProvider,
  PasswordHasher,
} from '../../apps/api/src/shared/identity/application/ports.js';
import { createCredentialRepository } from '../../apps/api/src/shared/identity/infrastructure/createCredentialRepository.js';

export async function runLocalIdentityRound(
  db: Database,
  pool: pg.Pool,
  hasher: PasswordHasher,
  provider: IdentityProvider,
  emit: (row: unknown) => Promise<void>,
) {
  const id = randomUUID();
  const username = `bench.${id.replaceAll('-', '').slice(0, 24)}`;
  const password = randomBytes(24).toString('hex');
  const nextPassword = randomBytes(24).toString('hex');
  const repository = createCredentialRepository(db);
  await emit({ type: 'fixture', accountId: id, username });
  try {
    const digest = await hasher.hash(password);
    await db.transaction(async (tx) => {
      await tx
        .insert(accounts)
        .values({ id, usernameNormalized: username, displayName: 'Đo local identity' });
      assert.equal(await createCredentialRepository(tx).insert(id, digest), 1);
    });
    const started = performance.now();
    const verified = await provider.verifyPassword(username, password);
    const verifyPasswordMs = performance.now() - started;
    assert.equal(verified?.accountId, id);
    assert.equal(verified.credentialVersion, 1);
    assert.equal(await provider.verifyPassword(username, nextPassword), null);
    assert.equal(await provider.verifyPassword(`missing.${id.slice(0, 8)}`, password), null);
    assert.equal(await repository.replace(id, await hasher.hash(nextPassword), 1), 2);
    assert.equal((await provider.verifyPassword(username, nextPassword))?.credentialVersion, 2);
    assert.equal(await provider.verifyPassword(username, password), null);
    return { verifyPasswordMs };
  } finally {
    // Chỉ xoá UUID tổng hợp của vòng này, kể cả lỗi ghi/verify; FK dọn credential.
    await pool.query('DELETE FROM accounts WHERE id = $1', [id]);
    assert.equal(await repository.findByUsername(username), null);
    const result = await pool.query('SELECT 1 FROM account_credentials WHERE account_id = $1', [id]);
    assert.equal(result.rowCount, 0);
    await emit({ type: 'cleanup', accountId: id, deleted: true });
  }
}
