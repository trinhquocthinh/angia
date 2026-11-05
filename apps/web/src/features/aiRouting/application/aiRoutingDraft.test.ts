import { describe, expect, it } from 'vitest';
import { DEFAULT_AI_ROUTING_SETTINGS } from '@angia/contracts';
import { toAiRoutingDraft } from './toAiRoutingDraft';
import { buildAiRoutingRequest } from './buildAiRoutingRequest';

const view = { version: 7, settings: DEFAULT_AI_ROUTING_SETTINGS, updatedAt: null, updatedBy: null };
const draft = () => toAiRoutingDraft(view);

describe('Bản sửa cấu hình OCR', () => {
  it('TC-508, TC-651: snapshot giữ version ban đầu, chỉ cặp model OpenRouter', () => {
    expect(toAiRoutingDraft(view)).toEqual({
      expectedVersion: 7,
      openrouterPrimary: 'google/gemini-3.1-flash-lite',
      openrouterFallback: 'moonshotai/kimi-k2.6',
    });
  });
  it('TC-508: lưu được cặp model mặc định', () => {
    const result = buildAiRoutingRequest(draft());
    expect(result.ok && result.request.settings).toEqual(DEFAULT_AI_ROUTING_SETTINGS);
  });
  it('TC-508: chỉ đúng model dự phòng trùng', () => {
    const input = draft();
    input.openrouterFallback = input.openrouterPrimary;
    const result = buildAiRoutingRequest(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.openrouterFallback).toBeTruthy();
  });
  it('TC-511: payload luôn dùng version của bản sửa, không đọc version mới ngoài form', () => {
    const result = buildAiRoutingRequest({ ...draft(), expectedVersion: 2 });
    expect(result.ok && result.request.expectedVersion).toBe(2);
  });
});
