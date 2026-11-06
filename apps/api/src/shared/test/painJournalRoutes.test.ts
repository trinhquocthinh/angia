import { describe, expect, it } from 'vitest';
import { createStubApp } from './createStubApp.js';
import { HEALTH_DATA_ROUTES } from './healthDataRoutes.js';
import { painJournalOperations } from './painJournalOperations.js';

describe('Kiểm kê HTTP sổ đau nhức', () => {
  it('TC-709: đủ 30 route và nhóm bảo mật cho hai cửa', () => {
    const app = createStubApp();
    const registered = new Set(app.routes.map((r) => `${r.method} ${r.path}`));
    const inventory: Record<string, string> = HEALTH_DATA_ROUTES;
    for (const base of ['/api/health-profiles/:id/pain-issues', '/api/me/profile/pain-issues']) {
      for (const [method, suffix] of painJournalOperations) {
        const key = `${method} ${base}${suffix}`;
        expect(registered.has(key), key).toBe(true);
        expect(inventory[key], key).toBe(
          base.includes('health-profiles') ? 'scoped' : method === 'GET' ? 'self' : 'self_write',
        );
      }
    }
  });

  it('TC-709: OpenAPI chứa đủ 30 operation và hợp đồng body cụ thể', () => {
    const doc = createStubApp().getOpenAPI31Document({
      openapi: '3.1.0',
      info: { title: 'Test', version: '1' },
    });
    const paths = Object.entries(doc.paths ?? {}).filter(([path]) => path.includes('/pain-issues'));
    expect(
      paths.flatMap(([, value]) =>
        Object.keys(value).filter((key) => ['get', 'post', 'patch', 'delete'].includes(key)),
      ),
    ).toHaveLength(30);
    expect(JSON.stringify(doc)).toContain('CreatePainIssueRequest');
  });
});
