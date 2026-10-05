import { computeSessionExpiry } from './computeSessionExpiry.js';

const SLIDE_STEP_MS = 24 * 60 * 60 * 1000;

// Hạn trượt 30 ngày (Tech Spec §5.1) nhưng chỉ ghi lại khi hạn mới xa hơn hạn cũ ≥ 1 ngày:
// sai số tối đa 1 ngày, đổi lại không phải UPDATE sessions ở mọi request.
export function shouldSlideSession(expiresAt: Date, now: Date): boolean {
  return computeSessionExpiry(now).getTime() - expiresAt.getTime() >= SLIDE_STEP_MS;
}
