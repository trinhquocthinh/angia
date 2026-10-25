import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Context } from 'hono';
import type { QuotaFailure } from '@src/features/familyQuota/domain/FamilyQuota.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import type { SlidingWindowLimiter } from '@src/shared/http/createSlidingWindowLimiter.js';
import { errorJson } from '@src/shared/http/errorResponse.js';
import { setQuotaRetryAfter } from '@src/features/familyQuota/presentation/setQuotaRetryAfter.js';
import { toSourceDocumentResponse } from '@src/features/documents/presentation/toSourceDocumentResponse.js';
import type { PrivacyDependencies } from '../application/ports.js';
import { createPrivacyDraft } from '../application/createPrivacyDraft.js';
import { getPrivacyDraft } from '../application/getPrivacyDraft.js';
import { openPrivacyImage } from '../application/openPrivacyImage.js';
import { approvePrivacy } from '../application/approvePrivacy.js';
import { selectManualEntry } from '../application/selectManualEntry.js';
import { registerPrivacyGuards } from './registerPrivacyGuards.js';
import {
  createPrivacyDraftRoute,
  getPrivacyDraftRoute,
  privacyImageRoute,
  approvePrivacyRoute,
  manualEntryRoute,
} from './privacyRouteDefinitions.js';
// Lỗi quota (SPEC-030) kèm details + Retry-After; lỗi nghiệp vụ khác không có details.
function quotaDetails(c: Context, failure: { code: string } | QuotaFailure, now: Date) {
  if (!('details' in failure)) return undefined;
  setQuotaRetryAfter(c, failure, now);
  return failure.details;
}
const familyOf = (c: { get(key: 'session'): AppEnv['Variables']['session'] }) => c.get('session')!.family!.id;
export function registerPrivacyRoutes(
  app: OpenAPIHono<AppEnv>,
  deps: PrivacyDependencies,
  limiter: SlidingWindowLimiter,
): void {
  registerPrivacyGuards(app, limiter);
  app.openapi(createPrivacyDraftRoute, async (c) => {
    const result = await createPrivacyDraft(deps, {
      familyId: familyOf(c),
      documentId: c.req.valid('param').id,
      edits: c.req.valid('json'),
    });
    if (result.ok) return c.json(result.value, 202);
    return c.json(...errorJson(result.code, quotaDetails(c, result, deps.quota.now())));
  });
  app.openapi(getPrivacyDraftRoute, async (c) => {
    const result = await getPrivacyDraft(deps.repository, deps.queue, {
      familyId: familyOf(c),
      documentId: c.req.valid('param').id,
    });
    return result.ok ? c.json(result.value, 200) : c.json(...errorJson(result.code));
  });
  app.openapi(privacyImageRoute, async (c) => {
    const { id, draftId } = c.req.valid('param');
    const result = await openPrivacyImage(deps.repository, deps.reader, {
      familyId: familyOf(c),
      documentId: id,
      draftId,
    });
    if (!result.ok) return c.json(...errorJson(result.code));
    c.header('Content-Type', 'image/png');
    return c.body(result.value.body, 200);
  });
  app.openapi(approvePrivacyRoute, async (c) => {
    const result = await approvePrivacy(deps, {
      ...c.req.valid('json'),
      familyId: familyOf(c),
      documentId: c.req.valid('param').id,
      accountId: c.get('session')!.account.id,
    });
    if (result.ok) return c.json(toSourceDocumentResponse(result.value), 200);
    return c.json(...errorJson(result.code, quotaDetails(c, result, deps.quota.now())));
  });
  app.openapi(manualEntryRoute, async (c) => {
    const result = await selectManualEntry(deps.repository, {
      familyId: familyOf(c),
      documentId: c.req.valid('param').id,
    });
    return result.ok
      ? c.json(toSourceDocumentResponse(result.value), 200)
      : c.json(...errorJson(result.code));
  });
}
