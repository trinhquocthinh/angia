import type { OpenAPIHono } from '@hono/zod-openapi';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { deleteAsNeededDose } from '../application/deleteAsNeededDose.js';
import { listAsNeededDoses } from '../application/listAsNeededDoses.js';
import type { AsNeededDoseClock, AsNeededDoseRepository } from '../application/ports.js';
import { recordAsNeededDose } from '../application/recordAsNeededDose.js';
import { setCourseInterval } from '../application/setCourseInterval.js';
import {
  deleteAsNeededDoseRoute,
  listAsNeededDosesRoute,
  recordAsNeededDoseRoute,
  setCourseIntervalRoute,
} from './asNeededDoseRouteDefinitions.js';
import { toAsNeededDoseResponse } from './toAsNeededDoseResponse.js';

// requireSession/CSRF toàn API; requireMain + no-store gắn trước tại registerProfileRoutes (BR-054: main ghi).
export function registerAsNeededDoseRoutes(
  app: OpenAPIHono<AppEnv>,
  repository: AsNeededDoseRepository,
  now: AsNeededDoseClock,
): void {
  app.openapi(recordAsNeededDoseRoute, async (c) => {
    const session = c.get('session')!;
    const body = c.req.valid('json');
    const result = await recordAsNeededDose(
      repository,
      {
        ...body,
        givenAt: new Date(body.givenAt),
        familyId: session.family!.id,
        accountId: session.account.id,
        profileId: c.req.valid('param').id,
      },
      now,
    );
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(toAsNeededDoseResponse(result.value), 201);
  });
  app.openapi(listAsNeededDosesRoute, async (c) => {
    const target = { familyId: c.get('session')!.family!.id, profileId: c.req.valid('param').id };
    const result = await listAsNeededDoses(repository, { ...target, ...c.req.valid('query') });
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json({ doses: result.value.map(toAsNeededDoseResponse) }, 200);
  });
  app.openapi(deleteAsNeededDoseRoute, async (c) => {
    const { id, doseId } = c.req.valid('param');
    const result = await deleteAsNeededDose(repository, {
      familyId: c.get('session')!.family!.id,
      profileId: id,
      doseId,
    });
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.body(null, 204);
  });
  app.openapi(setCourseIntervalRoute, async (c) => {
    const { id, courseId } = c.req.valid('param');
    const result = await setCourseInterval(repository, {
      familyId: c.get('session')!.family!.id,
      profileId: id,
      courseId,
      text: c.req.valid('json').text,
    });
    if (!result.ok) return c.json(...errorJson(result.code));
    return c.json(result.value, 200);
  });
}
