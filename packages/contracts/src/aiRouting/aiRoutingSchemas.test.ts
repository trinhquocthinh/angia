import { describe, expect, it } from 'vitest';
import { DEFAULT_AI_ROUTING_SETTINGS } from './aiRoutingDefaults.js';
import { aiRoutingViewSchema, updateAiRoutingRequestSchema } from './aiRoutingSchemas.js';

const settings = () => ({
  selectedProvider: 'woku',
  woku: {
    primaryModel: 'gemini-3-flash-preview',
    fallbackModel: 'gemini-3.8-flash',
  },
  openrouter: {
    primaryModel: 'google/gemini-3.1-flash-lite',
    fallbackModel: 'moonshotai/kimi-k2.6',
  },
});
const request = () => ({ expectedVersion: 0, settings: settings() });

describe('Hợp đồng cấu hình nhà cung cấp OCR trong Admin', () => {
  it('mặc định chọn Woku với Flash 3 Preview và Flash 3.8 dự phòng, không có hệ số', () => {
    expect(DEFAULT_AI_ROUTING_SETTINGS).toEqual(settings());
    expect(updateAiRoutingRequestSchema.safeParse(request()).success).toBe(true);
  });

  it.each(['fake', 'unknown'])('không coi %s là nhà cung cấp dịch vụ thật', (selectedProvider) => {
    const body = request();
    expect(
      updateAiRoutingRequestSchema.safeParse({
        ...body,
        settings: { ...body.settings, selectedProvider },
      }).success,
    ).toBe(false);
  });

  it.each(['woku', 'openrouter'] as const)('chặn model chính và dự phòng trùng nhau ở %s', (provider) => {
    const body = request();
    const models = body.settings[provider];
    const changed = {
      ...body.settings,
      [provider]: { ...models, fallbackModel: models.primaryModel },
    };
    expect(updateAiRoutingRequestSchema.safeParse({ ...body, settings: changed }).success).toBe(false);
  });

  it.each(['woku', 'openrouter'] as const)('chặn model ngoài danh mục ở %s', (provider) => {
    const body = request();
    const changed = {
      ...body.settings,
      [provider]: {
        ...body.settings[provider],
        primaryModel: 'arbitrary-model',
      },
    };
    expect(updateAiRoutingRequestSchema.safeParse({ ...body, settings: changed }).success).toBe(false);
  });

  it('chặn đưa hệ số riêng vào OpenRouter', () => {
    const body = request();
    const changed = {
      ...body.settings,
      openrouter: { ...body.settings.openrouter, usdPerCredit: '2' },
    };
    expect(updateAiRoutingRequestSchema.safeParse({ ...body, settings: changed }).success).toBe(false);
  });

  it.each(['apiKey', 'baseUrl', 'updatedBy', 'version'])(
    'chặn trường %s ngoài hợp đồng ở request',
    (field) => {
      expect(
        updateAiRoutingRequestSchema.safeParse({
          ...request(),
          [field]: 'untrusted',
        }).success,
      ).toBe(false);
    },
  );

  it('chặn key trong cấu hình provider, không chỉ ở cấp ngoài', () => {
    const body = request();
    const changed = {
      ...body.settings,
      woku: { ...body.settings.woku, apiKey: 'synthetic-secret' },
    };
    expect(updateAiRoutingRequestSchema.safeParse({ ...body, settings: changed }).success).toBe(false);
  });

  it.each([-1, 0.5, Infinity, '1', Number.MAX_SAFE_INTEGER + 1])(
    'chặn expectedVersion không hợp lệ: %s',
    (expectedVersion) => {
      expect(
        updateAiRoutingRequestSchema.safeParse({
          ...request(),
          expectedVersion,
        }).success,
      ).toBe(false);
    },
  );

  it('phản hồi bootstrap cho phép version 0, chưa có người cập nhật', () => {
    expect(
      aiRoutingViewSchema.safeParse({
        version: 0,
        settings: DEFAULT_AI_ROUTING_SETTINGS,
        updatedAt: null,
        updatedBy: null,
      }).success,
    ).toBe(true);
  });

  it('phản hồi cấu hình đã lưu có phiên bản, thời điểm UTC và người cập nhật', () => {
    expect(
      aiRoutingViewSchema.safeParse({
        version: 1,
        settings: settings(),
        updatedAt: '2026-10-26T08:00:00Z',
        updatedBy: '00000000-0000-4000-8000-000000000001',
      }).success,
    ).toBe(true);
  });
});
