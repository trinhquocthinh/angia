import { describe, expect, it } from 'vitest';
import { DEFAULT_AI_ROUTING_SETTINGS } from './aiRoutingDefaults.js';
import { updateAiRoutingRequestSchema } from './aiRoutingSchemas.js';

describe('Quy ước ngân sách provider 1:1 đã chốt', () => {
  it('TC-535: cho chọn Woku chỉ bằng cặp model, không cần field hệ số', () => {
    const models = {
      primaryModel: DEFAULT_AI_ROUTING_SETTINGS.woku.primaryModel,
      fallbackModel: DEFAULT_AI_ROUTING_SETTINGS.woku.fallbackModel,
    };
    expect(
      updateAiRoutingRequestSchema.safeParse({
        expectedVersion: 0,
        settings: { ...DEFAULT_AI_ROUTING_SETTINGS, woku: models },
      }).success,
    ).toBe(true);
  });

  it('TC-535: không nhận hệ số từ client cho cả hai provider', () => {
    for (const provider of ['woku', 'openrouter'] as const) {
      expect(
        updateAiRoutingRequestSchema.safeParse({
          expectedVersion: 0,
          settings: {
            ...DEFAULT_AI_ROUTING_SETTINGS,
            [provider]: { ...DEFAULT_AI_ROUTING_SETTINGS[provider], usdPerCredit: '0.25' },
          },
        }).success,
      ).toBe(false);
    }
  });
});
