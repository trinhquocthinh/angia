import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { getDoseSlots } from '../application/getDoseSlots.js';
import type { DoseSlotRepository } from '../application/ports.js';
import { setDoseSlots } from '../application/setDoseSlots.js';
import { getDoseSlotsRoute, setDoseSlotsRoute } from './doseSlotRouteDefinitions.js';

// requireSession/CSRF toàn API; requireMain + no-store gắn trước tại registerProfileRoutes (BR-036: main thiết lập).
export function registerDoseSlotRoutes(app: OpenAPIHono<AppEnv>, repository: DoseSlotRepository): void {
  app.openapi(getDoseSlotsRoute, async (c) => {
    const result = await getDoseSlots(repository, c.get('session')!.family!.id, c.req.valid('param').id);
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(result.value, 200);
  });
  app.openapi(setDoseSlotsRoute, async (c) => {
    const result = await setDoseSlots(repository, {
      familyId: c.get('session')!.family!.id,
      profileId: c.req.valid('param').id,
      slots: c.req.valid('json').slots,
    });
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(result.value, 200);
  });
}
