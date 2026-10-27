import type { AiRoutingSettings } from './aiRoutingSchemas.js';

// Cấu hình khởi tạo; ngân sách An Gia quy ước hai provider 1:1, không có hệ số tùy chỉnh.
export const DEFAULT_AI_ROUTING_SETTINGS = {
  selectedProvider: 'woku',
  woku: {
    primaryModel: 'gemini-3-flash-preview',
    fallbackModel: 'gemini-3.8-flash',
  },
  openrouter: {
    primaryModel: 'google/gemini-3.1-flash-lite',
    fallbackModel: 'moonshotai/kimi-k2.6',
  },
} as const satisfies AiRoutingSettings;
