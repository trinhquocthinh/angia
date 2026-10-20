import { z } from 'zod';

// Nguồn duy nhất đọc biến môi trường của API (10-setup-and-ops-guide §3).
// Chỉ khai báo biến đang dùng; ntfy bổ sung tại Epic tương ứng.
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
  // BR-018: trần hiển thị/khởi tạo khi extraction_spend chưa có tháng nào; phải trùng giá trị của worker.
  AI_DEFAULT_MONTHLY_CAP_USD: z.coerce.number().nonnegative().default(5),
  // SPEC-031: trần AI mặc định mỗi gia đình/tháng và ước tính mỗi lời gọi — phải trùng giá trị của worker.
  AI_DEFAULT_FAMILY_MONTHLY_CAP_USD: z.coerce.number().nonnegative().default(0.5),
  AI_ESTIMATED_COST_USD: z.coerce.number().positive().default(0.02),
  // F03b (SPEC-030, BR-043): quota tài nguyên theo gia đình và nhịp thao tác nặng theo tài khoản.
  QUOTA_FAMILY_STORAGE_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(2 * 1024 * 1024 * 1024),
  QUOTA_FAMILY_DAILY_UPLOADS: z.coerce.number().int().positive().default(100),
  QUOTA_FAMILY_PENDING_JOBS: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_HEAVY_PER_MINUTE: z.coerce.number().int().positive().default(10),
  // F08b (nợ #21): khi khởi động chỉ xóa thư mục angia-upload-* cũ hơn ngưỡng này (> timeout body 5 phút + ghi S3).
  UPLOAD_ORPHAN_GRACE_MINUTES: z.coerce.number().int().positive().default(15),
});

export type ApiConfig = z.infer<typeof apiEnvSchema>;

export function loadApiConfig(env: NodeJS.ProcessEnv): ApiConfig {
  return apiEnvSchema.parse(env);
}
