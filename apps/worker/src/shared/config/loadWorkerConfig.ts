import { z } from 'zod';

// Worker E0 chỉ cần DB cho pg-boss; biến AI/S3/ntfy bổ sung khi có job tương ứng.
const workerEnvSchema = z.object({
  STACK: z.enum(['dev', 'sit', 'prod']),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type WorkerConfig = z.infer<typeof workerEnvSchema>;

export function loadWorkerConfig(env: NodeJS.ProcessEnv): WorkerConfig {
  return workerEnvSchema.parse(env);
}
