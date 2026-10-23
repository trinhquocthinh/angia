import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { getReminderRecipients } from '../application/getReminderRecipients.js';
import type { ReminderRecipientRepository } from '../application/recipientPorts.js';
import { setReminderRecipients } from '../application/setReminderRecipients.js';
import {
  getReminderRecipientsRoute,
  setReminderRecipientsRoute,
} from './reminderRecipientRouteDefinitions.js';

// requireSession/CSRF toàn API; requireMain + no-store gắn trước tại registerProfileRoutes.
export function registerReminderRecipientRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: ReminderRecipientRepository,
): void {
  app.openapi(getReminderRecipientsRoute, async (c) => {
    const result = await getReminderRecipients(
      repository,
      c.get('session')!.family!.id,
      c.req.valid('param').id,
    );
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(result.value, 200);
  });
  app.openapi(setReminderRecipientsRoute, async (c) => {
    const result = await setReminderRecipients(repository, {
      familyId: c.get('session')!.family!.id,
      profileId: c.req.valid('param').id,
      recipientAccountIds: c.req.valid('json').recipientAccountIds,
    });
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(result.value, 200);
  });
}
