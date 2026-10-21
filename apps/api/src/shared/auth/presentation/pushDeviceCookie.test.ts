import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { clearPushDevice, readPushDevice, writePushDevice } from './pushDeviceCookie.js';

const settings = { secret: 'test-secret-test-secret-test-secret', secure: true };
function setup() {
  const app = new Hono();
  app.get('/write/:id', async (c) => {
    await writePushDevice(c, c.req.param('id'), settings);
    return c.body(null, 204);
  });
  app.get('/read', async (c) => c.json({ id: await readPushDevice(c, settings) }));
  app.get('/clear', (c) => {
    clearPushDevice(c, settings);
    return c.body(null, 204);
  });
  return app;
}
describe('Cookie nhận diện thiết bị push', () => {
  it('TC-361: cookie ký HttpOnly/Secure/Path=/api và không chấp nhận giả mạo', async () => {
    const app = setup();
    const id = randomUUID();
    const response = await app.request(`/write/${id}`);
    const cookie = response.headers.get('set-cookie')!;
    for (const attribute of ['HttpOnly', 'Secure', 'Path=/api', 'Max-Age=31536000', 'SameSite=Lax'])
      expect(cookie).toContain(attribute);
    expect(await (await app.request('/read', { headers: { cookie: cookie.split(';')[0]! } })).json()).toEqual(
      { id },
    );
    expect(
      await (await app.request('/read', { headers: { cookie: `angia_push_device=${id}.forged` } })).json(),
    ).toEqual({ id: null });
    expect((await app.request('/clear')).headers.get('set-cookie')).toContain('Max-Age=0');
  });
});
