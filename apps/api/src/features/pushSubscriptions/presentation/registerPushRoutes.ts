import { pushRouteActor } from './pushRouteActor.js';
import type { CookieSettings } from '@src/shared/auth/presentation/pendingLoginCookie.js';
import { writePushDevice, clearPushDevice } from '@src/shared/auth/presentation/pushDeviceCookie.js';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorResponse } from '@src/shared/http/errorResponse.js';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import { createSlidingWindowLimiter } from '@src/shared/http/createSlidingWindowLimiter.js';
import type { PushDependencies } from '../application/ports.js';
import { registerPushSubscription } from '../application/registerPushSubscription.js';
import { sendPushTest } from '../application/sendPushTest.js';
import {
  pushConfigRoute,
  pushRegisterRoute,
  pushDeleteRoute,
  pushTestRoute,
} from './pushRouteDefinitions.js';
const codes = {
  disabled: 'ERR_PUSH_DISABLED',
  invalid: 'ERR_VALIDATION',
  conflict: 'ERR_PUSH_CONFLICT',
  quota: 'ERR_PUSH_DEVICE_LIMIT',
  expired: 'ERR_UNAUTHENTICATED',
  missing: 'ERR_PUSH_NOT_REGISTERED',
} as const;

export function registerPushRoutes(
  app: OpenAPIHono<AppEnv>,
  deps: PushDependencies,
  cookies: CookieSettings,
): void {
  const limiter = createSlidingWindowLimiter({ limit: 3, windowMs: 60_000, now: () => deps.now().getTime() });
  app.use('/api/me/*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    const session = currentSession(c);
    if (!session.family) return errorResponse(c, 'ERR_FORBIDDEN');
    await next();
  });
  app.openapi(pushConfigRoute, async (c) =>
    c.json(
      {
        enabled: Boolean(deps.publicKey),
        publicKey: deps.publicKey,
        registered: Boolean(await deps.repository.read(await pushRouteActor(c, cookies), deps.now())),
      },
      200,
    ),
  );
  app.openapi(pushRegisterRoute, async (c) => {
    const body = c.req.valid('json');
    const result = await registerPushSubscription(deps, await pushRouteActor(c, cookies), body, body.intent);
    if (typeof result !== 'string') {
      await writePushDevice(c, result.deviceId, cookies);
      return c.body(null, 204);
    }
    return errorResponse(c, codes[result]);
  });
  app.openapi(pushDeleteRoute, async (c) => {
    await deps.repository.remove(await pushRouteActor(c, cookies));
    clearPushDevice(c, cookies);
    return c.body(null, 204);
  });
  app.openapi(pushTestRoute, async (c) => {
    const hit = limiter.hit(currentSession(c).sessionId);
    if (!hit.ok) {
      c.header('Retry-After', String(hit.retryAfterSeconds));
      return errorResponse(c, 'ERR_RATE_LIMITED');
    }
    const result = await sendPushTest(deps, await pushRouteActor(c, cookies));
    if (result === 'accepted') return c.body(null, 204);
    return errorResponse(
      c,
      result === 'disabled'
        ? 'ERR_PUSH_DISABLED'
        : result === 'missing' || result === 'gone'
          ? 'ERR_PUSH_NOT_REGISTERED'
          : 'ERR_PUSH_UNAVAILABLE',
    );
  });
}
