import { z } from 'zod';

export const SANITIZE_DOCUMENT_IMAGE_QUEUE = 'sanitize-document-image';
export const SANITIZE_DOCUMENT_IMAGE_QUEUE_OPTIONS = {
  retryLimit: 2,
  retryDelay: 30,
  retryBackoff: true,
  expireInSeconds: 300,
} as const;

export const sanitizeDocumentImageJobSchema = z.object({
  documentId: z.uuid(),
  familyId: z.uuid(),
});

export type SanitizeDocumentImageJob = z.infer<typeof sanitizeDocumentImageJobSchema>;
