import { z } from 'zod';

// Biến môi trường của tác vụ migrate (10-setup-and-ops-guide §3): chỉ cần kết nối role owner.
const migrateEnvSchema = z.object({
  DATABASE_OWNER_URL: z.string().url(),
});

export type MigrateConfig = z.infer<typeof migrateEnvSchema>;

export function loadMigrateConfig(env: NodeJS.ProcessEnv): MigrateConfig {
  return migrateEnvSchema.parse(env);
}
