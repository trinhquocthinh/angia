import { randomUUID } from 'node:crypto';
import { loadIdentitySpikeConfig } from '../../apps/api/src/shared/config/loadIdentitySpikeConfig.js';
import { createAuthentikIdentityProvider } from '../../apps/api/src/shared/identity/infrastructure/authentikIdentityProvider.js';
import { runIdentityProviderSpike } from './runIdentityProviderSpike.js';

try {
  const settings = loadIdentitySpikeConfig(process.env);
  const username = `spike-e24-${randomUUID()}`;
  // Chỉ ghi tên tổng hợp để dọn thủ công nếu mất mạng sau khi Authentik đã nhận lệnh tạo.
  console.info(`Tài khoản thử SIT: ${username}`);
  const report = await runIdentityProviderSpike(createAuthentikIdentityProvider(settings), username);
  console.info(JSON.stringify({ task: 'E24-S1-T1', group: settings.groupName, ...report }));
} catch (error) {
  const code =
    error instanceof Error && /^idp_[a-z_0-9]+$/.test(error.message) ? error.message : 'idp_spike_failed';
  console.error(`Spike không đạt: ${code}`);
  process.exitCode = 1;
}
