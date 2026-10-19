import type { Context } from 'hono';
import { errorJson } from '@src/shared/http/errorResponse.js';
import type { QuotaFailure } from '../domain/FamilyQuota.js';

const QUEUE_RETRY_AFTER_SECONDS = 30;

// SPEC-030: ảnh/ngày chờ tới 00:00 giờ VN; hàng đợi chờ 30 s; hết dung lượng không có Retry-After.
export function quotaErrorResponse(c: Context, failure: QuotaFailure, now: Date): Response {
  if (failure.code === 'ERR_DAILY_UPLOAD_QUOTA') {
    const seconds = Math.ceil((Date.parse(String(failure.details.resetsAt)) - now.getTime()) / 1000);
    c.header('Retry-After', String(Math.max(1, seconds)));
  }
  if (failure.code === 'ERR_QUEUE_QUOTA') c.header('Retry-After', String(QUEUE_RETRY_AFTER_SECONDS));
  return c.json(...errorJson(failure.code, failure.details));
}
