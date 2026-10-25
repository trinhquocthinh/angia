import { describe, expect, it } from 'vitest';
import { DEFAULT_MODELS, loadGoldenConfig } from './loadGoldenConfig.js';

const env = { OPENROUTER_API_KEY: 'sk-or-test' };

describe('loadGoldenConfig', () => {
  it('mặc định dùng endpoint OpenRouter, thư mục fixtures/golden và bộ model đã chốt', () => {
    expect(loadGoldenConfig(env, [])).toEqual({
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: 'sk-or-test',
      models: DEFAULT_MODELS,
      goldenDir: 'fixtures/golden',
      disableReasoning: true,
    });
  });

  it('bộ model mặc định là model chính Gemini 3.1 Flash-Lite và dự phòng Kimi K2.6 đã chốt', () => {
    expect(DEFAULT_MODELS).toEqual(['google/gemini-3.1-flash-lite', 'moonshotai/kimi-k2.6']);
  });

  it('nhận danh sách model qua --models và thư mục ảnh qua tham số vị trí', () => {
    const config = loadGoldenConfig(env, [
      '--models',
      'qwen/qwen3-vl-32b-instruct, moonshotai/kimi-k2.6',
      '/tmp/anh',
    ]);
    expect(config.models).toEqual(['qwen/qwen3-vl-32b-instruct', 'moonshotai/kimi-k2.6']);
    expect(config.goldenDir).toBe('/tmp/anh');
  });

  it('mặc định tắt suy luận như cấu hình vận hành; cờ --reasoning bật lại ở bất kỳ vị trí nào', () => {
    const config = loadGoldenConfig(env, ['fixtures/golden/redacted', '--reasoning']);
    expect(config).toMatchObject({ disableReasoning: false, goldenDir: 'fixtures/golden/redacted' });
  });

  it('cho phép đổi endpoint qua OPENROUTER_BASE_URL (chạy thử với server giả)', () => {
    const config = loadGoldenConfig({ ...env, OPENROUTER_BASE_URL: 'http://127.0.0.1:18765/v1' }, []);
    expect(config.baseUrl).toBe('http://127.0.0.1:18765/v1');
  });

  it('báo lỗi khi thiếu OPENROUTER_API_KEY', () => {
    expect(() => loadGoldenConfig({ OPENROUTER_API_KEY: '' }, [])).toThrow('OPENROUTER_API_KEY');
  });
});
