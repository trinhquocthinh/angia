import assert from 'node:assert/strict';
import { appendFile, mkdtemp } from 'node:fs/promises';
import { arch, availableParallelism, cpus, loadavg, platform, tmpdir, totalmem } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { createDatabase } from '../../apps/api/src/shared/db/createDatabase.js';
import { createArgon2PasswordHasher } from '../../apps/api/src/shared/identity/infrastructure/createArgon2PasswordHasher.js';
import { createCredentialRepository } from '../../apps/api/src/shared/identity/infrastructure/createCredentialRepository.js';
import { createLocalIdentityProvider } from '../../apps/api/src/shared/identity/infrastructure/createLocalIdentityProvider.js';
import { PASSWORD_HASH_LIMITS } from '../../apps/api/src/shared/identity/infrastructure/createPasswordHashLimiter.js';
import { runLocalIdentityBenchmark } from './runLocalIdentityBenchmark.js';
import { runLocalIdentityRound } from './runLocalIdentityRound.js';

let interrupted = false;
const onInterrupt = () => {
  interrupted = true;
};
process.on('SIGINT', onInterrupt);
process.on('SIGTERM', onInterrupt);
let pool: pg.Pool | undefined;
let output: string | undefined;
const emit = async (row: unknown) => {
  assert.ok(output);
  await appendFile(output, `${JSON.stringify(row)}\n`, { mode: 0o600 });
};

try {
  assert.equal(process.env.STACK, 'sit');
  assert.ok(process.env.DATABASE_URL);
  const args = process.argv.slice(2);
  assert.equal(args.length, 1);
  assert.match(args[0]!, /^--origin=(backend-sit|local-[a-z0-9-]+)$/);
  const origin = args[0]!.slice('--origin='.length);
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    connectionTimeoutMillis: 5000,
    query_timeout: 10000,
    statement_timeout: 10000,
  });
  const { rows } = await pool.query<{
    role: string;
    rolsuper: boolean;
    rolbypassrls: boolean;
    owns_accounts: boolean;
  }>(
    `SELECT current_user AS role, rolsuper, rolbypassrls,
      (SELECT relowner = (SELECT oid FROM pg_roles WHERE rolname = current_user)
       FROM pg_class WHERE oid = 'accounts'::regclass) AS owns_accounts
     FROM pg_roles WHERE rolname = current_user`,
  );
  const role = rows[0];
  assert.ok(role && ['angia_sit_app', 'angia_test_app'].includes(role.role));
  assert.equal(role.rolsuper || role.rolbypassrls || role.owns_accounts, false);
  if (origin === 'backend-sit') assert.equal(role.role, 'angia_sit_app');
  output = join(await mkdtemp(join(tmpdir(), 'angia-local-identity-')), 'measurements.jsonl');
  console.info(`Báo cáo: ${output}`);
  await emit({
    type: 'metadata',
    task: 'E26-S2-T3',
    scope: 'adapter-repository',
    startedAt: new Date().toISOString(),
    origin,
    role: role.role,
    node: process.version,
    platform: platform(),
    arch: arch(),
    cpu: cpus()[0]?.model,
    availableCpus: availableParallelism(),
    hostRamBytes: totalmem(),
    constrainedMemoryBytes: process.constrainedMemory(),
    loadBefore: loadavg(),
    limits: PASSWORD_HASH_LIMITS,
  });
  const db = createDatabase(pool);
  const hasher = createArgon2PasswordHasher();
  const provider = await createLocalIdentityProvider(createCredentialRepository(db), hasher);
  const summary = await runLocalIdentityBenchmark({
    runRound: () => runLocalIdentityRound(db, pool!, hasher, provider, emit),
    emit,
    shouldStop: () => interrupted,
  });
  const digest = await hasher.hash('Mật khẩu tổng hợp đo tải');
  const started = performance.now();
  const cpuStart = process.cpuUsage();
  const saturation = await Promise.allSettled(
    Array.from({ length: 4 }, () => hasher.verify(digest, 'Mật khẩu tổng hợp đo tải')),
  );
  assert.equal(saturation.filter((result) => result.status === 'fulfilled' && result.value).length, 3);
  assert.equal(
    saturation.filter(
      (result) =>
        result.status === 'rejected' &&
        result.reason instanceof Error &&
        result.reason.message === 'ERR_PASSWORD_HASH_BUSY',
    ).length,
    1,
  );
  await emit({
    type: 'saturation',
    submitted: 4,
    completed: 3,
    rejected: 1,
    elapsedMs: performance.now() - started,
    cpuMicroseconds: process.cpuUsage(cpuStart),
    processPeakRssBytes: process.resourceUsage().maxRSS * 1024,
    loadAfter: loadavg(),
  });
  await emit({ type: 'summary', ...summary, lifecycleAccepted: false });
  console.info(JSON.stringify(summary));
  process.exitCode = summary.adapterGatePassed ? 0 : 1;
} catch {
  const failure = { type: 'fatal', error: 'local_benchmark_failed', cleanupNeedsReview: true };
  if (output) await emit(failure).catch(() => {});
  console.error(JSON.stringify(failure));
  process.exitCode = 1;
} finally {
  await pool?.end();
  process.off('SIGINT', onInterrupt);
  process.off('SIGTERM', onInterrupt);
}
