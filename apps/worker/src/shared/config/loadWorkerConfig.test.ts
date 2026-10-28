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

const pushVars = {
  WEB_PUSH_PUBLIC_KEY: 'pub',
  WEB_PUSH_PRIVATE_KEY: 'priv',
  WEB_PUSH_SUBJECT: 'mailto:a@b.vn',
};

const sitIdp = {
  AUTHENTIK_URL: 'https://idp.example.vn',
  AUTHENTIK_API_TOKEN: 't',
  IDP_ACCESS_GROUP_NAME: 'angia-users',
  ADMIN_GROUP_NAME: 'angia-admins',
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

  it('TC-531: biến cũ chỉ suy ra run mode; thiếu key được phân loại theo provider tại từng lượt', () => {
    expect(loadWorkerConfig({ ...base, AI_PROVIDER: 'openrouter' })).toMatchObject({ AI_RUN_MODE: 'live' });
    expect(loadWorkerConfig(base)).toMatchObject({ AI_RUN_MODE: 'fake' });
  });

  it('TC-531: run mode tường minh ưu tiên biến cũ; provider/model thực lấy từ DB', () => {
    expect(loadWorkerConfig({ ...base, AI_RUN_MODE: 'live' })).toMatchObject({ AI_RUN_MODE: 'live' });
    expect(loadWorkerConfig({ ...base, AI_PROVIDER: undefined, AI_RUN_MODE: 'fake' })).toMatchObject({
      AI_RUN_MODE: 'fake',
    });
    expect(loadWorkerConfig({ ...base, AI_PROVIDER: 'openrouter', AI_RUN_MODE: 'fake' })).toMatchObject({
      AI_RUN_MODE: 'fake',
    });
    expect(() => loadWorkerConfig({ ...base, AI_RUN_MODE: 'woku' })).toThrow();
    expect(() => loadWorkerConfig({ ...base, AI_PROVIDER: undefined })).toThrow();
  });

  it('ngân sách AI (BR-018, CP5.5): mặc định trần $10, 10 lượt/gia đình; giá trị âm bị từ chối', () => {
    expect(loadWorkerConfig(base)).toMatchObject({
      AI_DEFAULT_MONTHLY_CAP_USD: 10,
      SCAN_QUOTA_DEFAULT_MONTHLY: 10,
    });
    expect(() => loadWorkerConfig({ ...base, SCAN_QUOTA_DEFAULT_MONTHLY: '-1' })).toThrow();
    expect(loadWorkerConfig({ ...base, AI_DEFAULT_MONTHLY_CAP_USD: '2.50' })).toMatchObject({
      AI_DEFAULT_MONTHLY_CAP_USD: 2.5,
    });
    expect(() => loadWorkerConfig({ ...base, AI_DEFAULT_MONTHLY_CAP_USD: '-1' })).toThrow();
  });

  it('TC-653: không còn AI_ESTIMATED_COST_USD, AI_DEFAULT_FAMILY_MONTHLY_CAP_USD; có đặt cũng bị bỏ qua', () => {
    const config = loadWorkerConfig({
      ...base,
      AI_ESTIMATED_COST_USD: '0',
      AI_DEFAULT_FAMILY_MONTHLY_CAP_USD: '-1',
    });
    expect(config).not.toHaveProperty('AI_ESTIMATED_COST_USD');
    expect(config).not.toHaveProperty('AI_DEFAULT_FAMILY_MONTHLY_CAP_USD');
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
      loadWorkerConfig({ ...base, STACK: 'prod', ...pushVars, ...idp, IDP_ACCESS_GROUP_NAME: undefined }),
    ).toThrow('IDP_ACCESS_GROUP_NAME');
    // dev có token thì phải đủ bộ biến
    expect(() => loadWorkerConfig({ ...base, AUTHENTIK_API_TOKEN: 't' })).toThrow('AUTHENTIK_URL');
    expect(
      loadWorkerConfig({ ...base, STACK: 'sit', ...pushVars, ...idp, IDP_SYNC_DRY_RUN: 'true' }),
    ).toMatchObject({
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
    expect(loadWorkerConfig({ ...base, STACK: 'sit', ...pushVars, ...idp })).toMatchObject({
      AUTHENTIK_API_TOKEN: 't',
      IDP_ACCESS_GROUP_NAME: 'angia-sit-users',
      ADMIN_GROUP_NAME: 'angia-admins',
    });
    for (const key of ['AUTHENTIK_API_TOKEN', 'IDP_ACCESS_GROUP_NAME', 'ADMIN_GROUP_NAME'] as const) {
      expect(() => loadWorkerConfig({ ...base, STACK: 'sit', ...pushVars, ...idp, [key]: '   ' })).toThrow(
        key,
      );
      expect(() => loadWorkerConfig({ ...base, ...idp, [key]: ' \t' })).toThrow(key);
    }
    // API không có mặc định cho ADMIN_GROUP_NAME: sit/prod thiếu thì dừng, dev giữ mặc định.
    for (const ADMIN_GROUP_NAME of [undefined, ''])
      expect(() =>
        loadWorkerConfig({ ...base, STACK: 'prod', ...pushVars, ...idp, ADMIN_GROUP_NAME }),
      ).toThrow('ADMIN_GROUP_NAME');
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

  it('Web Push — dev thiếu cả bộ thì null, đủ thì object, thiếu một phần thì dừng; sit/prod bắt buộc đủ', () => {
    const push = {
      WEB_PUSH_PUBLIC_KEY: 'pub',
      WEB_PUSH_PRIVATE_KEY: 'priv',
      WEB_PUSH_SUBJECT: 'mailto:a@b.vn',
    };
    expect(loadWorkerConfig(base).webPush).toBeNull();
    expect(
      loadWorkerConfig({ ...base, WEB_PUSH_PUBLIC_KEY: '', WEB_PUSH_PRIVATE_KEY: '' }).webPush,
    ).toBeNull();
    expect(loadWorkerConfig({ ...base, ...push }).webPush).toEqual({
      publicKey: 'pub',
      privateKey: 'priv',
      subject: 'mailto:a@b.vn',
    });
    for (const key of Object.keys(push)) {
      const partial = { ...push, [key]: undefined };
      expect(() => loadWorkerConfig({ ...base, ...partial })).toThrow(key);
      expect(() => loadWorkerConfig({ ...base, ...partial, [key]: '' })).toThrow(key);
      expect(() => loadWorkerConfig({ ...base, ...sitIdp, ...partial, STACK: 'prod' })).toThrow(key);
    }
    expect(loadWorkerConfig({ ...base, ...sitIdp, ...push, STACK: 'sit' }).webPush).not.toBeNull();
    expect(() => loadWorkerConfig({ ...base, ...sitIdp, STACK: 'sit' })).toThrow('WEB_PUSH_PUBLIC_KEY');
  });
});

it('TC-544: nguồn phí mặc định rỗng; đọc JSON tường minh và không lộ credential trong lỗi', () => {
  expect(loadWorkerConfig(base).AI_BILLING_SOURCES_JSON).toEqual([]);
  const source = { id: '01900000-0000-7000-8000-000000000001', provider: 'openrouter', apiKey: 'synthetic' };
  expect(
    loadWorkerConfig({ ...base, AI_BILLING_SOURCES_JSON: JSON.stringify([source]) }).AI_BILLING_SOURCES_JSON,
  ).toEqual([source]);
  expect(() => loadWorkerConfig({ ...base, AI_BILLING_SOURCES_JSON: 'synthetic' })).toThrow(
    'billing_sources_invalid',
  );
});

it('TC-544: cấu hình nguồn phí không rỗng phải bao phủ key OpenRouter runtime cả ở fake', () => {
  const source = {
    id: '01900000-0000-7000-8000-000000000001',
    provider: 'openrouter',
    apiKey: 'configured-synthetic',
  };
  const vars = {
    ...base,
    OPENROUTER_API_KEY: 'runtime-synthetic',
    AI_BILLING_SOURCES_JSON: JSON.stringify([source]),
  };
  expect(() => loadWorkerConfig(vars)).toThrow('Nguồn phí phải bao phủ credential OpenRouter đang cấu hình');
  try {
    loadWorkerConfig(vars);
  } catch (error) {
    expect(String(error)).not.toContain('runtime-synthetic');
    expect(String(error)).not.toContain('configured-synthetic');
    expect(String(error)).toContain('AI_BILLING_SOURCES_JSON');
  }
  expect(
    loadWorkerConfig({ ...vars, OPENROUTER_API_KEY: ' configured-synthetic ' }).AI_BILLING_SOURCES_JSON,
  ).toEqual([source]);
  expect(loadWorkerConfig({ ...vars, OPENROUTER_API_KEY: ' ' }).AI_BILLING_SOURCES_JSON).toEqual([source]);
  expect(loadWorkerConfig({ ...vars, AI_BILLING_SOURCES_JSON: '[]' }).AI_BILLING_SOURCES_JSON).toEqual([]);
  expect(() =>
    loadWorkerConfig({
      ...vars,
      AI_BILLING_SOURCES_JSON: JSON.stringify([{ ...source, apiKey: 'other-synthetic' }]),
    }),
  ).toThrow('Nguồn phí phải bao phủ credential OpenRouter đang cấu hình');
});
