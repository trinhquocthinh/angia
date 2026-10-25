import type { OpenAPIHono } from '@hono/zod-openapi';
import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson, errorResponse } from '@src/shared/http/errorResponse.js';
import { getMyConsent } from '../application/getMyConsent.js';
import type { MyConsentRepository } from '../application/ports.js';
import { withdrawMyConsent } from '../application/withdrawMyConsent.js';
import { getMyConsentRoute, withdrawMyConsentRoute } from './myConsentRouteDefinitions.js';

// requireSession toàn API (kể cả CSRF cho POST); không requireMain vì member liên kết cũng tự rút được.
// Hồ sơ lấy từ phiên, không nhận từ client.
export function registerMyConsentRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: MyConsentRepository,
  now: () => Date,
): void {
  app.use('/api/me/consent*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    if (!currentSession(c).family) return errorResponse(c, 'ERR_FORBIDDEN');
    await next();
  });
  app.openapi(getMyConsentRoute, async (c) => {
    const session = currentSession(c);
    const { profile } = await getMyConsent(repository, {
      familyId: session.family!.id,
      healthProfileId: session.account.healthProfileId,
    });
    return c.json(
      {
        profile: profile && {
          ...profile,
          withdrawnAt: profile.withdrawnAt?.toISOString() ?? null,
        },
      },
      200,
    );
  });
  app.openapi(withdrawMyConsentRoute, async (c) => {
    const session = currentSession(c);
    const result = await withdrawMyConsent(
      repository,
      {
        familyId: session.family!.id,
        accountId: session.account.id,
        healthProfileId: session.account.healthProfileId,
      },
      now,
    );
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(
      { consentStatus: result.value.consentStatus, withdrawnAt: result.value.withdrawnAt.toISOString() },
      200,
    );
  });
}
