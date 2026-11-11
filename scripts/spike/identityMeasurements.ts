import { appendFile, mkdtemp, writeFile } from 'node:fs/promises';
import { arch, platform, tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadIdentitySpikeConfig } from '../../apps/api/src/shared/config/loadIdentitySpikeConfig.js';
import { createAuthentikIdentityProvider } from '../../apps/api/src/shared/identity/infrastructure/authentikIdentityProvider.js';
import { identitySpikeError } from './identitySpikeError.js';
import { loadIdentityMeasurementOptions } from './loadIdentityMeasurementOptions.js';
import { runIdentityMeasurements } from './runIdentityMeasurements.js';
import { runIdentityRound } from './runIdentityRound.js';
import { renderIdentityMeasurementReport } from './renderIdentityMeasurementReport.js';

let reportPath: string | undefined;
let interrupted = false;
const onInterrupt = () => {
  interrupted = true;
};
process.on('SIGINT', onInterrupt);
process.on('SIGTERM', onInterrupt);
try {
  const settings = loadIdentitySpikeConfig(process.env);
  const options = loadIdentityMeasurementOptions(process.argv.slice(2));
  const started = performance.now();
  const directory = await mkdtemp(join(tmpdir(), 'angia-identity-spike-'));
  reportPath = join(directory, 'measurements.jsonl');
  const output = reportPath;
  const emit = async (record: unknown) => {
    const line = JSON.stringify(record);
    await appendFile(output, `${line}\n`, { mode: 0o600 });
    console.info(line);
  };
  console.info(`Báo cáo: ${output}`);
  await emit({
    type: 'metadata',
    task: 'E24-S1-T2',
    startedAt: new Date().toISOString(),
    apiUrl: settings.apiUrl,
    group: settings.groupName,
    flow: settings.flowSlug,
    ...options,
    platform: platform(),
    arch: arch(),
    node: process.version,
  });
  const provider = createAuthentikIdentityProvider(settings);
  const { rows, ...summary } = await runIdentityMeasurements({
    remainingMs: Math.max(0, (360 - options.spentMinutes) * 60_000 - (performance.now() - started)),
    runRound: (round, username, stopReason) => runIdentityRound(provider, round, username, stopReason),
    emit,
    shouldStop: () => interrupted,
  });
  await emit({ type: 'summary', ...summary });
  const tablePath = join(directory, 'measurements.md');
  await writeFile(tablePath, renderIdentityMeasurementReport(rows, summary, options.origin), {
    flag: 'wx',
    mode: 0o600,
  });
  console.info(`Bảng đo: ${tablePath}`);
  process.exitCode = summary.verdict === 'pass' ? 0 : 1;
} catch (error) {
  const failure = JSON.stringify({ type: 'fatal', error: identitySpikeError(error) });
  if (reportPath) await appendFile(reportPath, `${failure}\n`).catch(() => {});
  console.error(failure);
  process.exitCode = 1;
} finally {
  process.off('SIGINT', onInterrupt);
  process.off('SIGTERM', onInterrupt);
}
