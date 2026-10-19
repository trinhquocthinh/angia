import type { Context } from 'hono';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { QuotaFailure } from '../domain/FamilyQuota.js';
import { setQuotaRetryAfter } from './setQuotaRetryAfter.js';

// Cho route Hono thường (upload multipart); route OpenAPI gọi setQuotaRetryAfter + c.json(errorJson) để giữ kiểu.
export function quotaErrorResponse(c: Context, failure: QuotaFailure, now: Date): Response {
  setQuotaRetryAfter(c, failure, now);
  return c.json(...errorJson(failure.code, failure.details));
}
