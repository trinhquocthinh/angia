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

describe('Ân hạn dọn thư mục tạm upload mồ côi (F08b, nợ #21)', () => {
  it('mặc định 15 phút; chỉ nhận số nguyên dương', () => {
    expect(loadApiConfig(env).UPLOAD_ORPHAN_GRACE_MINUTES).toBe(15);
    expect(loadApiConfig({ ...env, UPLOAD_ORPHAN_GRACE_MINUTES: '30' }).UPLOAD_ORPHAN_GRACE_MINUTES).toBe(30);
    for (const value of ['0', '-1', '1.5'])
      expect(() => loadApiConfig({ ...env, UPLOAD_ORPHAN_GRACE_MINUTES: value })).toThrow();
  });
});

describe('Trần AI theo gia đình (SPEC-031, BR-018)', () => {
  it('mặc định trần gia đình $0.50 và ước tính $0.02 (trùng worker); giá trị âm bị từ chối', () => {
    expect(loadApiConfig(env)).toMatchObject({
      AI_DEFAULT_FAMILY_MONTHLY_CAP_USD: 0.5,
      AI_ESTIMATED_COST_USD: 0.02,
    });
    expect(() => loadApiConfig({ ...env, AI_DEFAULT_FAMILY_MONTHLY_CAP_USD: '-1' })).toThrow();
    expect(() => loadApiConfig({ ...env, AI_ESTIMATED_COST_USD: '0' })).toThrow();
  });
  it('CP5.5: mặc định trần $10, 10 lượt/gia đình, dự phòng 15%, chi phí khởi đầu 0.001594/lượt', () => {
    expect(loadApiConfig(env)).toMatchObject({
      AI_DEFAULT_MONTHLY_CAP_USD: 10,
      SCAN_QUOTA_DEFAULT_MONTHLY: 10,
      SCAN_QUOTA_RESERVE_PERCENT: 15,
      SCAN_QUOTA_INITIAL_COST_PER_SCAN_USD: '0.001594',
    });
    // Dự phòng 100% làm phép chia (1 − dự phòng) bằng 0 khi tính USD cần nâng trần.
    expect(() => loadApiConfig({ ...env, SCAN_QUOTA_RESERVE_PERCENT: '100' })).toThrow();
    expect(loadApiConfig({ ...env, SCAN_QUOTA_RESERVE_PERCENT: '99' }).SCAN_QUOTA_RESERVE_PERCENT).toBe(99);
    expect(() => loadApiConfig({ ...env, SCAN_QUOTA_INITIAL_COST_PER_SCAN_USD: '1e-3' })).toThrow();
  });
});
