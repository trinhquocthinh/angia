import { describe, expect, it } from 'vitest';
import { loadWorkerConfig } from './loadWorkerConfig.js';

const base = {
  STACK: 'dev',
  DATABASE_URL: 'postgres://angia_dev_app:x@localhost:5432/angia_dev',
  S3_ENDPOINT: 'http://localhost:3900',
  S3_REGION: 'garage',
  S3_BUCKET: 'angia-dev',
  S3_ACCESS_KEY_ID: 'GK0',
  S3_SECRET_ACCESS_KEY: 'secret',
  S3_FORCE_PATH_STYLE: 'true',
  AI_PROVIDER: 'fake',
};

describe('Cấu hình worker', () => {
  it('AI_PROVIDER=fake không cần key; model và URL OpenRouter có mặc định', () => {
    expect(loadWorkerConfig(base)).toMatchObject({
      S3_FORCE_PATH_STYLE: true,
      AI_PROVIDER: 'fake',
      OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
      AI_PRIMARY_MODEL: 'google/gemini-3.1-flash-lite',
      AI_FALLBACK_MODEL: 'moonshotai/kimi-k2.6',
    });
  });

  it('AI_PROVIDER=openrouter thiếu OPENROUTER_API_KEY thì dừng khởi động', () => {
    expect(() => loadWorkerConfig({ ...base, AI_PROVIDER: 'openrouter' })).toThrow('OPENROUTER_API_KEY');
    expect(
      loadWorkerConfig({ ...base, AI_PROVIDER: 'openrouter', OPENROUTER_API_KEY: 'sk-or-x' }),
    ).toMatchObject({
      AI_PROVIDER: 'openrouter',
    });
  });

  it('ngân sách AI (BR-018): mặc định trần $5.00, ước tính $0.02; giá trị âm/không phải số bị từ chối', () => {
    expect(loadWorkerConfig(base)).toMatchObject({
      AI_DEFAULT_MONTHLY_CAP_USD: 5,
      AI_ESTIMATED_COST_USD: 0.02,
    });
    expect(
      loadWorkerConfig({ ...base, AI_DEFAULT_MONTHLY_CAP_USD: '2.50', AI_ESTIMATED_COST_USD: '0.01' }),
    ).toMatchObject({ AI_DEFAULT_MONTHLY_CAP_USD: 2.5, AI_ESTIMATED_COST_USD: 0.01 });
    expect(() => loadWorkerConfig({ ...base, AI_DEFAULT_MONTHLY_CAP_USD: '-1' })).toThrow();
    expect(() => loadWorkerConfig({ ...base, AI_ESTIMATED_COST_USD: '0' })).toThrow();
    expect(() => loadWorkerConfig({ ...base, AI_ESTIMATED_COST_USD: 'abc' })).toThrow();
  });

  it('trần AI theo gia đình (SPEC-031): mặc định $0.50, giá trị âm bị từ chối', () => {
    expect(loadWorkerConfig(base)).toMatchObject({ AI_DEFAULT_FAMILY_MONTHLY_CAP_USD: 0.5 });
    expect(() => loadWorkerConfig({ ...base, AI_DEFAULT_FAMILY_MONTHLY_CAP_USD: '-0.1' })).toThrow();
  });

  it('TC-332: biến đồng bộ IdP — bắt buộc ở sit/prod, tùy chọn ở dev, mặc định angia-admins/10/false', () => {
    expect(loadWorkerConfig(base)).toMatchObject({
      ADMIN_GROUP_NAME: 'angia-admins',
      IDP_SYNC_MAX_REVOKES: 10,
      IDP_SYNC_DRY_RUN: false,
    });
    expect(loadWorkerConfig(base).AUTHENTIK_API_TOKEN).toBeUndefined();
    // .env dev chép từ .env.example để trống các biến này = chưa cấu hình
    expect(
      loadWorkerConfig({ ...base, AUTHENTIK_URL: '', AUTHENTIK_API_TOKEN: '', IDP_ACCESS_GROUP_NAME: '' })
        .AUTHENTIK_API_TOKEN,
    ).toBeUndefined();
    const idp = {
      AUTHENTIK_URL: 'https://auth.example.test',
      AUTHENTIK_API_TOKEN: 't',
      IDP_ACCESS_GROUP_NAME: 'angia-sit-users',
      ADMIN_GROUP_NAME: 'angia-admins',
    };
    expect(() => loadWorkerConfig({ ...base, STACK: 'sit' })).toThrow('AUTHENTIK_API_TOKEN');
    expect(() =>
      loadWorkerConfig({ ...base, STACK: 'prod', ...idp, IDP_ACCESS_GROUP_NAME: undefined }),
    ).toThrow('IDP_ACCESS_GROUP_NAME');
    // dev có token thì phải đủ bộ biến
    expect(() => loadWorkerConfig({ ...base, AUTHENTIK_API_TOKEN: 't' })).toThrow('AUTHENTIK_URL');
    expect(loadWorkerConfig({ ...base, STACK: 'sit', ...idp, IDP_SYNC_DRY_RUN: 'true' })).toMatchObject({
      IDP_SYNC_DRY_RUN: true,
      IDP_ACCESS_GROUP_NAME: 'angia-sit-users',
    });
    for (const invalid of [
      { IDP_SYNC_MAX_REVOKES: '0' },
      { IDP_SYNC_MAX_REVOKES: '2.5' },
      { IDP_SYNC_DRY_RUN: 'yes' },
      { AUTHENTIK_URL: 'not-a-url' },
    ])
      expect(() => loadWorkerConfig({ ...base, ...invalid })).toThrow();
  });

  it('TC-351: biến IdP được trim; chuỗi chỉ khoảng trắng bị từ chối; ADMIN_GROUP_NAME bắt buộc ở sit/prod', () => {
    const idp = {
      AUTHENTIK_URL: 'https://auth.example.test',
      AUTHENTIK_API_TOKEN: ' t \n',
      IDP_ACCESS_GROUP_NAME: ' angia-sit-users ',
      ADMIN_GROUP_NAME: ' angia-admins ',
    };
    expect(loadWorkerConfig({ ...base, STACK: 'sit', ...idp })).toMatchObject({
      AUTHENTIK_API_TOKEN: 't',
      IDP_ACCESS_GROUP_NAME: 'angia-sit-users',
      ADMIN_GROUP_NAME: 'angia-admins',
    });
    for (const key of ['AUTHENTIK_API_TOKEN', 'IDP_ACCESS_GROUP_NAME', 'ADMIN_GROUP_NAME'] as const) {
      expect(() => loadWorkerConfig({ ...base, STACK: 'sit', ...idp, [key]: '   ' })).toThrow(key);
      expect(() => loadWorkerConfig({ ...base, ...idp, [key]: ' \t' })).toThrow(key);
    }
    // API không có mặc định cho ADMIN_GROUP_NAME: sit/prod thiếu thì dừng, dev giữ mặc định.
    for (const ADMIN_GROUP_NAME of [undefined, ''])
      expect(() => loadWorkerConfig({ ...base, STACK: 'prod', ...idp, ADMIN_GROUP_NAME })).toThrow(
        'ADMIN_GROUP_NAME',
      );
    expect(loadWorkerConfig({ ...base, ADMIN_GROUP_NAME: '' }).ADMIN_GROUP_NAME).toBe('angia-admins');
  });

  it('TC-321: biến dọn object mồ côi có mặc định 24/500/false và từ chối giá trị không hợp lệ', () => {
    expect(loadWorkerConfig(base)).toMatchObject({
      ORPHAN_OBJECT_GRACE_HOURS: 24,
      ORPHAN_OBJECT_MAX_DELETES: 500,
      ORPHAN_OBJECT_DRY_RUN: false,
    });
    expect(loadWorkerConfig({ ...base, ORPHAN_OBJECT_DRY_RUN: 'true' })).toMatchObject({
      ORPHAN_OBJECT_DRY_RUN: true,
    });
    for (const invalid of [
      { ORPHAN_OBJECT_GRACE_HOURS: '0' },
      { ORPHAN_OBJECT_GRACE_HOURS: '1.5' },
      { ORPHAN_OBJECT_MAX_DELETES: '0' },
      { ORPHAN_OBJECT_DRY_RUN: 'yes' },
    ])
      expect(() => loadWorkerConfig({ ...base, ...invalid })).toThrow();
  });
});
