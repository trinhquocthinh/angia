import { z } from 'zod';

// Nguồn duy nhất đọc biến môi trường của API (10-setup-and-ops-guide §3).
// Web Push E8: để trống cả bộ VAPID thì tắt; khai báo thiếu bộ thì từ chối khởi động.
const apiEnvSchema = z.object({
  WEB_PUSH_PUBLIC_KEY: z.string().default(''),
  WEB_PUSH_PRIVATE_KEY: z.string().default(''),
  WEB_PUSH_SUBJECT: z.string().default(''),
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
  AI_DEFAULT_MONTHLY_CAP_USD: z.coerce.number().nonnegative().default(10),
  // CP5.5: lượt mặc định mỗi gia đình/tháng (trùng worker), dự phòng % trần và chi phí khởi đầu mỗi lượt.
  SCAN_QUOTA_DEFAULT_MONTHLY: z.coerce.number().int().nonnegative().default(10),
  SCAN_QUOTA_RESERVE_PERCENT: z.coerce.number().min(0).max(99).default(15),
  SCAN_QUOTA_INITIAL_COST_PER_SCAN_USD: z
    .string()
    .regex(/^(0|[1-9][0-9]{0,27})(\.[0-9]{1,12})?$/)
    .default('0.001594'),
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
  const config = apiEnvSchema.parse(env);
  const { WEB_PUSH_PUBLIC_KEY: pub, WEB_PUSH_PRIVATE_KEY: key, WEB_PUSH_SUBJECT: subject } = config;
  if (pub || key || subject) {
    if (
      !/^[A-Za-z0-9_-]{87}$/.test(pub) ||
      !/^[A-Za-z0-9_-]{43}$/.test(key) ||
      !/^(mailto:[^\s@]+@[^\s@]+\.[^\s@]+|https:\/\/[^\s]+)$/.test(subject)
    ) {
      throw new Error('Cần khai báo đầy đủ bộ WEB_PUSH_PUBLIC_KEY/PRIVATE_KEY/SUBJECT hợp lệ.');
    }
  }
  return config;
}
