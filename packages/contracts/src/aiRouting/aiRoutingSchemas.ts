import { z } from 'zod';
import { OPENROUTER_OCR_MODELS, WOKU_OCR_MODELS } from './aiModelCatalog.js';

const wokuSettingsSchema = z
  .strictObject({
    primaryModel: z.enum(WOKU_OCR_MODELS),
    fallbackModel: z.enum(WOKU_OCR_MODELS),
  })
  .refine((value) => value.primaryModel !== value.fallbackModel, {
    message: 'Model dự phòng phải khác model chính',
    path: ['fallbackModel'],
  });

const openRouterSettingsSchema = z
  .strictObject({
    primaryModel: z.enum(OPENROUTER_OCR_MODELS),
    fallbackModel: z.enum(OPENROUTER_OCR_MODELS),
  })
  .refine((value) => value.primaryModel !== value.fallbackModel, {
    message: 'Model dự phòng phải khác model chính',
    path: ['fallbackModel'],
  });

// selectedProvider là cấu hình mong muốn; không khẳng định worker đã gọi dịch vụ thật.
export const aiRoutingSettingsSchema = z
  .strictObject({
    selectedProvider: z.enum(['woku', 'openrouter']),
    woku: wokuSettingsSchema,
    openrouter: openRouterSettingsSchema,
  })
  .meta({ id: 'AiRoutingSettings' });

export type AiRoutingSettings = z.infer<typeof aiRoutingSettingsSchema>;

// Quy ước ngân sách 1:1 nằm ở chính sách An Gia; không nhận hệ số từ client.
export const updateAiRoutingRequestSchema = z
  .strictObject({
    expectedVersion: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    settings: aiRoutingSettingsSchema,
  })
  .meta({ id: 'UpdateAiRoutingRequest' });

export type UpdateAiRoutingRequest = z.infer<typeof updateAiRoutingRequestSchema>;

export const aiRoutingViewSchema = z
  .strictObject({
    version: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    settings: aiRoutingSettingsSchema,
    updatedAt: z.iso.datetime().nullable(),
    updatedBy: z.uuid().nullable(),
  })
  .meta({ id: 'AiRoutingView' });

export type AiRoutingView = z.infer<typeof aiRoutingViewSchema>;
