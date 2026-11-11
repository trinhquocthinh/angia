import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';
import { todayState } from '../todayState.js';
import { assertTodayPreview } from './assertTodayPreview.js';

// Chỉ phục vụ bản build với dữ liệu giả trên loopback; không có proxy tới SIT/API thật.
const root = fileURLToPath(new URL('../../', import.meta.url));
const html = await readFile(new URL('../../dist/index.html', import.meta.url), 'utf8');
const state = todayState('member');
const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
const responses: Record<string, unknown> = {
  '/api/me': state.session,
  '/api/me/profile': {
    id: state.profiles[0]!.id,
    displayName: 'Mẹ',
    birthYear: 1950,
    showsVitals: false,
    consentStatus: 'confirmed',
  },
  '/api/me/profile/reminders': state.rows.map((row) => ({ ...row, date })),
  '/api/health-profiles': state.profiles,
  '/api/source-documents': { items: [], nextCursor: null },
  '/api/me/consent': { profile: null },
};
const server = await preview({
  root,
  configFile: false,
  preview: { host: '127.0.0.1', port: 5177, strictPort: true },
  plugins: [
    {
      name: 'today-a11y-fixture',
      configurePreviewServer(server) {
        server.middlewares.use((request, response, next) => {
          const url = new URL(request.url ?? '/', 'http://127.0.0.1:5177');
          if (url.pathname.startsWith('/api/')) {
            const body = request.method === 'GET' ? responses[url.pathname] : undefined;
            response.statusCode = body === undefined ? 404 : 200;
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify(body ?? { error: { code: 'ERR_NOT_FOUND' } }));
          } else if (url.pathname === '/') {
            const theme = url.searchParams.get('a11yTheme') === 'dark' ? 'dark' : 'light';
            response.setHeader('Content-Type', 'text/html; charset=utf-8');
            response.end(
              html.replace('<head>', `<head><script>localStorage.setItem('angia-theme','${theme}')</script>`),
            );
          } else next();
        });
      },
    },
  ],
});
try {
  await assertTodayPreview('http://127.0.0.1:5177');
  console.log('TODAY_A11Y_READY');
} catch (error) {
  await server.close();
  throw error;
}
