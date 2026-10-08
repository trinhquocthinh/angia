import { describe, expect, it } from 'vitest';
import { createStubApp } from '@src/shared/test/createStubApp.js';
describe('Header ảnh riêng tư', () => {
  it('TC-177b: no-store và nosniff cả khi thiếu phiên', async () => {
    const response = await createStubApp().request(
      '/api/source-documents/22222222-2222-4222-8222-222222222222/privacy-draft',
    );
    expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });
});
