import { z } from 'zod';

// Nguồn duy nhất đọc biến môi trường của worker (10-setup-and-ops-guide §3).
// AI_FALLBACK_MODEL bổ sung ở E3-S6-T2; ntfy ở v0.1b.
const workerEnvSchema = z
  .object({
    STACK: z.enum(['dev', 'sit', 'prod']),
    DATABASE_URL: z.string().url(),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    S3_ENDPOINT: z.string().url(),
    S3_REGION: z.string().min(1),
    S3_BUCKET: z.string().min(1),
    S3_ACCESS_KEY_ID: z.string().min(1),
    S3_SECRET_ACCESS_KEY: z.string().min(1),
    S3_FORCE_PATH_STYLE: z.enum(['true', 'false']).transform((value) => value === 'true'),
    // Dev để `fake` để không phát sinh chi phí (Setup gotcha 8.8).
    AI_PROVIDER: z.enum(['openrouter', 'fake']),
    OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
    OPENROUTER_API_KEY: z.string().optional(),
    AI_PRIMARY_MODEL: z.string().min(1).default('google/gemini-3.1-flash-lite'),
    // BR-018: trần khởi tạo khi chưa có tháng nào trong extraction_spend; ước tính giữ chỗ mỗi lần gọi AI.
    AI_DEFAULT_MONTHLY_CAP_USD: z.coerce.number().nonnegative().default(5),
    AI_ESTIMATED_COST_USD: z.coerce.number().positive().default(0.02),
  })
  .refine((env) => env.AI_PROVIDER !== 'openrouter' || Boolean(env.OPENROUTER_API_KEY), {
    message: 'AI_PROVIDER=openrouter bắt buộc có OPENROUTER_API_KEY',
    path: ['OPENROUTER_API_KEY'],
  });

export type WorkerConfig = z.infer<typeof workerEnvSchema>;

export function loadWorkerConfig(env: NodeJS.ProcessEnv): WorkerConfig {
  return workerEnvSchema.parse(env);
}
