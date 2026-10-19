import { describe, expect, it } from 'vitest';
import { loadApiConfig } from './loadApiConfig.js';

const env = {
  STACK: 'dev',
  DATABASE_URL: 'postgres://localhost/angia',
  S3_ENDPOINT: 'http://localhost:3900',
  S3_REGION: 'garage',
  S3_BUCKET: 'angia',
  S3_ACCESS_KEY_ID: 'key',
  S3_SECRET_ACCESS_KEY: 'secret',
  S3_FORCE_PATH_STYLE: 'true',
  OIDC_ISSUER_URL: 'https://issuer.test',
  OIDC_CLIENT_ID: 'client',
  OIDC_CLIENT_SECRET: 'secret',
  OIDC_REDIRECT_URI: 'http://localhost:5173/api/auth/callback',
  SESSION_COOKIE_SECRET: 'a'.repeat(48),
  ADMIN_GROUP_NAME: 'admin',
  APP_BASE_URL: 'http://localhost:5173',
};
describe('Origin ứng dụng trong cấu hình API', () => {
  it('yêu cầu URL cấu hình rõ ràng, không suy ra từ header người gọi', () => {
    expect(loadApiConfig(env).APP_BASE_URL).toBe('http://localhost:5173');
    expect(() => loadApiConfig({ ...env, APP_BASE_URL: undefined })).toThrow();
    expect(() => loadApiConfig({ ...env, APP_BASE_URL: 'bogus' })).toThrow();
  });
});

describe('Ngưỡng quota tài nguyên gia đình (SPEC-030, BR-043)', () => {
  it('mặc định 2 GiB, 100 ảnh/ngày, 10 chứng từ chờ worker, 10 thao tác nặng/phút', () => {
    const config = loadApiConfig(env);
    expect(config.QUOTA_FAMILY_STORAGE_BYTES).toBe(2147483648);
    expect(config.QUOTA_FAMILY_DAILY_UPLOADS).toBe(100);
    expect(config.QUOTA_FAMILY_PENDING_JOBS).toBe(10);
    expect(config.RATE_LIMIT_HEAVY_PER_MINUTE).toBe(10);
  });

  it('chỉ nhận số nguyên dương', () => {
    for (const name of [
      'QUOTA_FAMILY_STORAGE_BYTES',
      'QUOTA_FAMILY_DAILY_UPLOADS',
      'QUOTA_FAMILY_PENDING_JOBS',
      'RATE_LIMIT_HEAVY_PER_MINUTE',
    ]) {
      for (const value of ['0', '-1', '1.5'])
        expect(() => loadApiConfig({ ...env, [name]: value })).toThrow();
    }
    expect(loadApiConfig({ ...env, QUOTA_FAMILY_PENDING_JOBS: '3' }).QUOTA_FAMILY_PENDING_JOBS).toBe(3);
  });
});
