import { currentSession } from '@src/shared/auth/presentation/currentSession.js';
import { readPushDevice } from '@src/shared/auth/presentation/pushDeviceCookie.js';
import type { CookieSettings } from '@src/shared/auth/presentation/pendingLoginCookie.js';

export async function pushRouteActor(c: Parameters<typeof currentSession>[0], cookies: CookieSettings) {
  const s = currentSession(c);
  return {
    familyId: s.family!.id,
    accountId: s.account.id,
    sessionId: s.sessionId,
    deviceId: await readPushDevice(c, cookies),
  };
}
