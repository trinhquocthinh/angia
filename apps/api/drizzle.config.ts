import { defineConfig } from 'drizzle-kit';

// `yarn db:generate` chỉ sinh SQL từ schema, không kết nối DB; áp dụng bằng `yarn db:migrate`.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/shared/db/schema/index.ts',
  out: './drizzle',
});
