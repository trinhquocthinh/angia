import { describe, expect, it } from 'vitest';
import { DEFAULT_AI_ROUTING_SETTINGS, type AiRoutingView } from '@angia/contracts';
import { resolveExtractionSnapshot } from './resolveExtractionSnapshot.js';

const view = (): AiRoutingView => ({
  version: 7,
  settings: structuredClone(DEFAULT_AI_ROUTING_SETTINGS),
  updatedAt: null,
  updatedBy: null,
});

describe('SPEC-041: snapshot cấu hình cho một lượt OCR', () => {
  it('TC-516: fake chốt OpenRouter và tháng ngân sách', () => {
    expect(resolveExtractionSnapshot(view(), 'fake', new Date('2026-10-31T17:00:00Z'))).toEqual({
      runMode: 'fake',
      provider: 'openrouter',
      primaryModel: 'google/gemini-3.1-flash-lite',
      fallbackModel: 'moonshotai/kimi-k2.6',
      month: '2026-11',
      version: 7,
    });
  });

  it('TC-517: snapshot bất biến, giữ model đã chốt dù cấu hình đổi sau đó', () => {
    const config = view();
    const snapshot = resolveExtractionSnapshot(config, 'live', new Date('2026-10-15T00:00:00Z'));
    config.settings.openrouter.primaryModel = 'moonshotai/kimi-k2.6';
    expect(snapshot.primaryModel).toBe('google/gemini-3.1-flash-lite');
    expect(snapshot).not.toHaveProperty('usdPerCredit');
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it('TC-518: OpenRouter chốt đúng cặp model của provider được chọn', () => {
    const config = view();
    expect(resolveExtractionSnapshot(config, 'live', new Date('2026-10-31T16:59:59Z'))).toMatchObject({
      provider: 'openrouter',
      primaryModel: 'google/gemini-3.1-flash-lite',
      fallbackModel: 'moonshotai/kimi-k2.6',
      month: '2026-10',
      version: 7,
    });
  });
});
