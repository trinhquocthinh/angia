import { expect, it } from 'vitest';
import { loadIdentitySpikeConfig } from './loadIdentitySpikeConfig.js';

const env = {
  STACK: 'sit',
  SPIKE_AUTHENTIK_API_TOKEN: 'spike-token',
  SPIKE_AUTHENTIK_FLOW_SLUG: 'spike-login',
};

it('TC-873 cấu hình spike chỉ dùng SIT và token riêng', () => {
  expect(loadIdentitySpikeConfig(env)).toEqual({
    apiUrl: 'https://auth.toniboy.io.vn/api/v3/',
    token: 'spike-token',
    flowSlug: 'spike-login',
    groupName: 'angia-sit-users',
  });
  expect(() => loadIdentitySpikeConfig({ ...env, STACK: 'prod' })).toThrow('idp_invalid_spike_config');
});

it('TC-873 không lấy token chỉ đọc của worker thay token spike', () => {
  expect(() => loadIdentitySpikeConfig({ STACK: 'sit', AUTHENTIK_API_TOKEN: 'sync-token' })).toThrow(
    'idp_invalid_spike_config',
  );
});
