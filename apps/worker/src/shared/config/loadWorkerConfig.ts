import { z } from 'zod';

// Nguồn duy nhất đọc biến môi trường của worker (10-setup-and-ops-guide §3).
// Web Push (E9-S2-T2) dùng chung bộ biến WEB_PUSH_* với API.

// Biến để trống trong .env (chép từ .env.example) coi như chưa đặt.
const unsetWhenEmpty = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());
// Bỏ khoảng trắng/xuống dòng thừa khi dán token, tên nhóm; chuỗi chỉ toàn khoảng trắng bị từ chối (không coi là chưa đặt).
const trimmedText = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : value),
  z.string().min(1, 'không được chỉ có khoảng trắng'),
);

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
    // Model chính lỗi mạng/HTTP/timeout thì gọi model này trong cùng lượt thử (E3-S6-T2).
    AI_FALLBACK_MODEL: z.string().min(1).default('moonshotai/kimi-k2.6'),
    // BR-018: trần khởi tạo khi chưa có tháng nào trong extraction_spend; ước tính giữ chỗ mỗi lần gọi AI.
    AI_DEFAULT_MONTHLY_CAP_USD: z.coerce.number().nonnegative().default(5),
    AI_ESTIMATED_COST_USD: z.coerce.number().positive().default(0.02),
    // SPEC-031: trần mặc định mỗi gia đình/tháng khi families.extraction_cap_usd để trống; trùng giá trị API.
    AI_DEFAULT_FAMILY_MONTHLY_CAP_USD: z.coerce.number().nonnegative().default(0.5),
    // BR-044/SPEC-032: dọn object S3 mồ côi — ân hạn (giờ), trần xóa mỗi lần quét, chạy thử chỉ đếm.
    ORPHAN_OBJECT_GRACE_HOURS: z.coerce.number().int().min(1).default(24),
    ORPHAN_OBJECT_MAX_DELETES: z.coerce.number().int().min(1).default(500),
    ORPHAN_OBJECT_DRY_RUN: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    // BR-045/SPEC-033: đồng bộ phiên với Authentik mỗi 5 phút. Bắt buộc ở sit/prod; dev không token = tắt job.
    AUTHENTIK_URL: unsetWhenEmpty(z.string().url()),
    AUTHENTIK_API_TOKEN: unsetWhenEmpty(trimmedText),
    IDP_ACCESS_GROUP_NAME: unsetWhenEmpty(trimmedText),
    // Trùng giá trị API (đồng bộ is_system_admin lúc đăng nhập). API không có mặc định nên sit/prod bắt buộc;
    // dev thiếu thì dùng `angia-admins`.
    ADMIN_GROUP_NAME: unsetWhenEmpty(trimmedText),
    IDP_SYNC_MAX_REVOKES: z.coerce.number().int().min(1).default(10),
    // SPEC-027: gửi lời nhắc qua Web Push; trùng tên biến và giá trị với API. Bắt buộc đủ bộ ở sit/prod; dev không đặt = tắt job.
    WEB_PUSH_PUBLIC_KEY: unsetWhenEmpty(trimmedText),
    WEB_PUSH_PRIVATE_KEY: unsetWhenEmpty(trimmedText),
    WEB_PUSH_SUBJECT: unsetWhenEmpty(trimmedText),
    IDP_SYNC_DRY_RUN: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
  })
  .refine((env) => env.AI_PROVIDER !== 'openrouter' || Boolean(env.OPENROUTER_API_KEY), {
    message: 'AI_PROVIDER=openrouter bắt buộc có OPENROUTER_API_KEY',
    path: ['OPENROUTER_API_KEY'],
  })
  .superRefine((env, ctx) => {
    if (env.STACK === 'dev' && !env.AUTHENTIK_API_TOKEN) return;
    const required = ['AUTHENTIK_URL', 'AUTHENTIK_API_TOKEN', 'IDP_ACCESS_GROUP_NAME'] as const;
    for (const key of env.STACK === 'dev' ? required : [...required, 'ADMIN_GROUP_NAME' as const])
      if (!env[key])
        ctx.addIssue({
          code: 'custom',
          message: `Đồng bộ phiên IdP (SPEC-033) bắt buộc có ${key}`,
          path: [key],
        });
  })
  .superRefine((env, ctx) => {
    const keys = ['WEB_PUSH_PUBLIC_KEY', 'WEB_PUSH_PRIVATE_KEY', 'WEB_PUSH_SUBJECT'] as const;
    if (env.STACK === 'dev' && keys.every((key) => !env[key])) return;
    for (const key of keys)
      if (!env[key])
        ctx.addIssue({ code: 'custom', message: `Gửi lời nhắc Web Push bắt buộc có ${key}`, path: [key] });
  })
  .transform(
    ({
      WEB_PUSH_PUBLIC_KEY: publicKey,
      WEB_PUSH_PRIVATE_KEY: privateKey,
      WEB_PUSH_SUBJECT: subject,
      ...env
    }) => ({
      ...env,
      ADMIN_GROUP_NAME: env.ADMIN_GROUP_NAME ?? 'angia-admins',
      webPush: publicKey && privateKey && subject ? { publicKey, privateKey, subject } : null,
    }),
  );

export type WorkerConfig = z.infer<typeof workerEnvSchema>;

export function loadWorkerConfig(env: NodeJS.ProcessEnv): WorkerConfig {
  return workerEnvSchema.parse(env);
}
