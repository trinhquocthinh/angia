import { describe, expect, it } from 'vitest';
import { DEFAULT_AI_ROUTING_SETTINGS } from '@angia/contracts';
import { toAiRoutingDraft } from './toAiRoutingDraft';
import { buildAiRoutingRequest } from './buildAiRoutingRequest';

const view = { version: 7, settings: DEFAULT_AI_ROUTING_SETTINGS, updatedAt: null, updatedBy: null };
const draft = () => toAiRoutingDraft(view);

describe('Bản sửa cấu hình OCR', () => {
  it('TC-508: snapshot giữ version ban đầu và không có hệ số', () => {
    expect(toAiRoutingDraft(view)).toMatchObject({ expectedVersion: 7, selectedProvider: 'woku' });
    expect(toAiRoutingDraft(view)).not.toHaveProperty('wokuRate');
  });
  it('TC-508: đổi provider không mất hai cặp model', () => {
    const result = buildAiRoutingRequest({ ...draft(), selectedProvider: 'openrouter' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.request.settings.woku).toEqual(view.settings.woku);
      expect(result.request.settings.openrouter).toEqual(view.settings.openrouter);
    }
  });
  it('Woku lưu được model mà không cần hệ số', () => {
    expect(buildAiRoutingRequest(draft()).ok).toBe(true);
  });
  it.each(['woku', 'openrouter'] as const)('TC-508: chỉ đúng model dự phòng trùng ở %s', (provider) => {
    const input = draft();
    if (provider === 'woku') input.wokuFallback = input.wokuPrimary;
    else input.openrouterFallback = input.openrouterPrimary;
    const result = buildAiRoutingRequest(input);
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errors[provider === 'woku' ? 'wokuFallback' : 'openrouterFallback']).toBeTruthy();
  });
  it('TC-511: payload luôn dùng version của bản sửa, không đọc version mới ngoài form', () => {
    const result = buildAiRoutingRequest({ ...draft(), expectedVersion: 2 });
    expect(result.ok && result.request.expectedVersion).toBe(2);
  });
});
