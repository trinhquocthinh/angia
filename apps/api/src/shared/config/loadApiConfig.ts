import { z } from 'zod';

// Nguồn duy nhất đọc biến môi trường của API (10-setup-and-ops-guide §3).
// Chỉ khai báo biến đang dùng; AI/ntfy bổ sung tại Epic tương ứng.
const apiEnvSchema = z.object({
  STACK: z.enum(['dev', 'sit', 'prod']),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DATABASE_URL: z.string().url(),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_FORCE_PATH_STYLE: z.enum(['true', 'false']).transform((value) => value === 'true'),
  OIDC_ISSUER_URL: z.string().url(),
  OIDC_CLIENT_ID: z.string().min(1),
  OIDC_CLIENT_SECRET: z.string().min(1),
  OIDC_REDIRECT_URI: z.string().url(),
  // Khóa ký cookie phiên, tối thiểu 32 byte (`openssl rand -base64 48`).
  SESSION_COOKIE_SECRET: z.string().min(32),
  APP_BASE_URL: z.string().url(),
  ADMIN_GROUP_NAME: z.string().min(1),
});

export type ApiConfig = z.infer<typeof apiEnvSchema>;

export function loadApiConfig(env: NodeJS.ProcessEnv): ApiConfig {
  return apiEnvSchema.parse(env);
}
