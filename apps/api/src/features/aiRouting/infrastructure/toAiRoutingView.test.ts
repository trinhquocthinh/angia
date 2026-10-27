import { describe, expect, it } from 'vitest';
import { DEFAULT_AI_ROUTING_SETTINGS } from '@angia/contracts';
import { toAiRoutingView } from './toAiRoutingView.js';

const row = () => ({
  version: '1',
  settings: DEFAULT_AI_ROUTING_SETTINGS,
  updated_at: '2026-10-26 15:00:00+07',
  updated_by: '00000000-0000-4000-8000-000000000001',
});

describe('Đọc cấu hình OCR từ kết quả SQL Drizzle', () => {
  it('TC-469: chuỗi timestamptz từ Drizzle được chuẩn hóa UTC, không giả định là Date', () => {
    expect(toAiRoutingView(row()).updatedAt).toBe('2026-10-26T08:00:00.000Z');
  });
  it('TC-471: mất singleton không tự tạo cấu hình mặc định', () => {
    expect(() => toAiRoutingView(undefined)).toThrow('migration');
  });
  it('TC-471: không trả version vượt giới hạn số nguyên an toàn', () => {
    expect(() => toAiRoutingView({ ...row(), version: '9007199254740992' })).toThrow();
  });
  it('TC-471: DB có trường secret ngoài hợp đồng thì báo lỗi, không trả secret ra API', () => {
    expect(() =>
      toAiRoutingView({ ...row(), settings: { ...DEFAULT_AI_ROUTING_SETTINGS, apiKey: 'synthetic-secret' } }),
    ).toThrow();
  });
});
