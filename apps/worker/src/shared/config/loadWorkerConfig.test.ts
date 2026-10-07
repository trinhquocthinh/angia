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
});
