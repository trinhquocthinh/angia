import { z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type {
  EntryTarget,
  ExerciseTarget,
  PainIssueOutcome,
  PainIssueRepository,
  PainIssueSession,
} from '../application/ports.js';
import type { PainJournalRouteDependencies } from './painJournalDependencies.js';

type Target = PainIssueSession & EntryTarget & ExerciseTarget;
export interface PainRequest {
  repository: PainIssueRepository;
  target: Target;
  body: unknown;
  query: Record<string, string>;
  now: PainJournalRouteDependencies['now'];
}

export function painJournalHandler(
  deps: PainJournalRouteDependencies,
  self: boolean,
  status: 200 | 201 | 204,
  action: (request: PainRequest) => Promise<PainIssueOutcome<unknown>>,
) {
  return async (c: Context<AppEnv>): Promise<Response> => {
    const session = c.get('session')!;
    const profileId = self ? session.account.healthProfileId : c.req.param('id');
    if (!profileId || !session.family) return c.json(...errorJson('ERR_NOT_FOUND'));
    const params = c.req.param();
    if (Object.values(params).some((id) => !z.uuid().safeParse(id).success))
      return c.json(...errorJson('ERR_NOT_FOUND'));
    const body: unknown = ['POST', 'PATCH', 'DELETE'].includes(c.req.method)
      ? await c.req.json<unknown>().catch(() => undefined)
      : undefined;
    // Owner chốt: root POST cố chọn hồ sơ khác trả 404; không nhận profileId từ client.
    if (
      self &&
      c.req.method === 'POST' &&
      !params.issueId &&
      body !== null &&
      typeof body === 'object' &&
      'profileId' in body &&
      body.profileId !== profileId
    )
      return c.json(...errorJson('ERR_NOT_FOUND'));
    const result = await action({
      repository: self ? deps.forProfile(profileId) : deps.repository,
      target: {
        familyId: session.family.id,
        profileId,
        accountId: session.account.id,
        issueId: params.issueId ?? '',
        entryId: params.entryId ?? '',
        exerciseId: params.exerciseId ?? '',
      },
      // JSON hỏng được application kiểm sau phạm vi và consent.
      body,
      query: c.req.query(),
      now: deps.now,
    });
    if (!result.ok) return c.json(...errorJson(result.code, result.details));
    if (status === 204) return c.body(null, 204);
    return c.json(result.value, status);
  };
}
