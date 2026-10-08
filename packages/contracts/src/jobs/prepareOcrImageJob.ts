import { z } from 'zod';
import { createPrivacyDraftRequestSchema } from '../documents/privacySchemas.js';
export const PREPARE_OCR_IMAGE_QUEUE = 'prepare-ocr-image';
export const PREPARE_OCR_IMAGE_QUEUE_OPTIONS = {
  retryLimit: 2,
  retryDelay: 30,
  retryBackoff: true,
  expireInSeconds: 300,
} as const;
export const prepareOcrImageJobSchema = z
  .object({
    documentId: z.uuid(),
    familyId: z.uuid(),
    draftId: z.uuid(),
    edits: createPrivacyDraftRequestSchema,
  })
  .strict();
export type PrepareOcrImageJob = z.infer<typeof prepareOcrImageJobSchema>;
