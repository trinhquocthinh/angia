import type { AiRoutingSettings } from './aiRoutingSchemas.js';

// Cấu hình khởi tạo OpenRouter (CP5.6); không có hệ số tùy chỉnh.
export const DEFAULT_AI_ROUTING_SETTINGS = {
  openrouter: {
    primaryModel: 'google/gemini-3.1-flash-lite',
    fallbackModel: 'moonshotai/kimi-k2.6',
  },
} as const satisfies AiRoutingSettings;
