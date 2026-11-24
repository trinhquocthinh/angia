import { z } from 'zod';

// Tech Spec §10.5: bên xếp job render sẵn nội dung và link từ APP_BASE_URL.
export const SEND_TRANSACTIONAL_EMAIL_QUEUE = 'send-transactional-email';
export const SEND_TRANSACTIONAL_EMAIL_QUEUE_OPTIONS = {
  retryLimit: 5,
  retryDelay: 60,
  retryBackoff: true,
} as const;
export const sendTransactionalEmailJobSchema = z.object({
  to: z.email(),
  subject: z.string().min(1).max(200),
  text: z.string().min(1).max(10000),
});
export type SendTransactionalEmailJob = z.infer<typeof sendTransactionalEmailJobSchema>;
