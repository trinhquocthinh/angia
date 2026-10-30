import { describe, expect, it } from 'vitest';
import { readSitConfig } from './readSitConfig.js';

const env = {
  E2E_BASE_URL: 'https://angia-sit.toniboy.io.vn',
  E2E_FAMILY_ID: '11111111-1111-4111-8111-111111111111',
  E2E_STORAGE_STATE: '/tmp/angia-e2e/auth.json',
};

describe('Phạm vi E2E SIT trước mọi thao tác ghi/xóa', () => {
  it('TC-092/093: chỉ nhận đúng origin SIT, family UUID và đường dẫn phiên', () => {
    expect(readSitConfig(env)).toEqual({
      baseURL: env.E2E_BASE_URL,
      familyId: env.E2E_FAMILY_ID,
      storageState: env.E2E_STORAGE_STATE,
    });
  });
  it.each([
    'https://angia.toniboy.io.vn',
    'https://angia-sit.toniboy.io.vn.example.com',
    'https://user:password@angia-sit.toniboy.io.vn',
    'http://angia-sit.toniboy.io.vn',
    'https://angia-sit.toniboy.io.vn/api',
  ])('TC-092/093: từ chối đích ngoài SIT trước khi gọi API (%s)', (url) => {
    expect(() => readSitConfig({ ...env, E2E_BASE_URL: url })).toThrow('E2E_BASE_URL');
  });
  it.each(['E2E_FAMILY_ID', 'E2E_STORAGE_STATE'])(
    'TC-092/093: thiếu %s phải thất bại, không bỏ qua test',
    (key) => {
      expect(() => readSitConfig({ ...env, [key]: '' })).toThrow(key);
    },
  );
  it('TC-092/093: từ chối family ID sai định dạng', () => {
    expect(() => readSitConfig({ ...env, E2E_FAMILY_ID: 'wrong-family' })).toThrow('E2E_FAMILY_ID');
  });
});
