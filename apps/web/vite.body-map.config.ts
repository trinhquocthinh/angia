import { realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Harness riêng, không sinh route hoặc đưa trang kiểm thử vào bản build ứng dụng.
export default defineConfig({
  resolve: { alias: { '@src': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [react(), tailwindcss()],
  cacheDir: join(tmpdir(), 'angia-body-map-vite'),
  optimizeDeps: { entries: ['e2e/bodyMap2D.html', 'e2e/newPainIssue.html'] },
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
    fs: {
      allow: [
        fileURLToPath(new URL('../..', import.meta.url)),
        realpathSync(new URL('../../node_modules', import.meta.url)),
      ],
    },
  },
});
