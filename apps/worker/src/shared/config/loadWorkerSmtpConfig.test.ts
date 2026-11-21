import { describe, expect, it } from 'vitest';
import { loadWorkerConfig } from './loadWorkerConfig.js';
const base = {
  STACK: 'dev',
  DATABASE_URL: 'postgres://app:x@localhost/db',
  AI_PROVIDER: 'fake',
  S3_ENDPOINT: 'http://localhost:3900',
  S3_REGION: 'garage',
  S3_BUCKET: 'dev',
  S3_ACCESS_KEY_ID: 'key',
  S3_SECRET_ACCESS_KEY: 'secret',
  S3_FORCE_PATH_STYLE: 'true',
  AUTHENTIK_URL: 'https://idp.example.test',
  AUTHENTIK_API_TOKEN: 'token',
  IDP_ACCESS_GROUP_NAME: 'users',
  ADMIN_GROUP_NAME: 'admins',
  WEB_PUSH_PUBLIC_KEY: 'pub',
  WEB_PUSH_PRIVATE_KEY: 'priv',
  WEB_PUSH_SUBJECT: 'mailto:a@b.vn',
};
const smtp = { SMTP_HOST: 'localhost', SMTP_PORT: '1025', MAIL_FROM: 'no-reply@example.test' };
describe('Cấu hình SMTP worker', () => {
  it('dev không đặt hoặc để trống tất cả biến SMTP thì tắt job', () => {
    expect(loadWorkerConfig(base).smtp).toBeNull();
    expect(
      loadWorkerConfig({
        ...base,
        SMTP_HOST: '',
        SMTP_PORT: '',
        SMTP_USER: '',
        SMTP_PASSWORD: '',
        SMTP_SECURE: '',
        MAIL_FROM: '',
      }).smtp,
    ).toBeNull();
  });
  it('dev và sit đủ bộ không cần auth, port thành số và secure mặc định false', () => {
    for (const STACK of ['dev', 'sit'])
      expect(loadWorkerConfig({ ...base, ...smtp, STACK }).smtp).toEqual({
        host: 'localhost',
        port: 1025,
        secure: false,
        from: smtp.MAIL_FROM,
      });
  });
  it.each(['SMTP_HOST', 'SMTP_PORT', 'MAIL_FROM'] as const)(
    'thiếu hoặc trống %s bị từ chối khi bật SMTP ở mọi stack',
    (key) => {
      for (const STACK of ['dev', 'sit', 'prod'])
        for (const value of [undefined, ''])
          expect(() =>
            loadWorkerConfig({ ...base, ...smtp, SMTP_USER: 'u', SMTP_PASSWORD: 'p', STACK, [key]: value }),
          ).toThrow(key);
    },
  );
  it.each(['sit', 'prod'])('%s bắt buộc SMTP kể cả không đặt cả bộ', (STACK) => {
    expect(() => loadWorkerConfig({ ...base, STACK })).toThrow('SMTP_HOST');
  });
  it('user và password phải đi cùng nhau; prod bắt buộc có cả hai', () => {
    for (const STACK of ['dev', 'sit', 'prod']) {
      expect(() => loadWorkerConfig({ ...base, ...smtp, STACK, SMTP_USER: 'u' })).toThrow('SMTP_PASSWORD');
      expect(() => loadWorkerConfig({ ...base, ...smtp, STACK, SMTP_PASSWORD: 'p' })).toThrow('SMTP_USER');
    }
    expect(() => loadWorkerConfig({ ...base, ...smtp, STACK: 'prod' })).toThrow('SMTP_USER');
    expect(
      loadWorkerConfig({
        ...base,
        ...smtp,
        STACK: 'prod',
        SMTP_USER: 'u',
        SMTP_PASSWORD: 'p',
        SMTP_SECURE: 'true',
      }).smtp,
    ).toEqual({
      host: 'localhost',
      port: 1025,
      secure: true,
      from: smtp.MAIL_FROM,
      user: 'u',
      password: 'p',
    });
  });
  it.each([
    { SMTP_PORT: '0' },
    { SMTP_PORT: '65536' },
    { SMTP_PORT: '1.5' },
    { SMTP_PORT: 'abc' },
    { SMTP_SECURE: 'yes' },
  ])('từ chối biến sai %j', (invalid) => {
    expect(() => loadWorkerConfig({ ...base, ...smtp, ...invalid })).toThrow();
  });
  it('dev có biến SMTP lẻ không được âm thầm tắt job', () => {
    for (const partial of [
      { SMTP_PORT: '1025' },
      { SMTP_USER: 'u', SMTP_PASSWORD: 'p' },
      { SMTP_SECURE: 'false' },
      { MAIL_FROM: smtp.MAIL_FROM },
    ])
      expect(() => loadWorkerConfig({ ...base, ...partial })).toThrow('SMTP_HOST');
  });
});
