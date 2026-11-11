import type { PrivacyEdits } from '@angia/contracts';
import { planRedaction } from './planRedaction';
import type { ImageSize, RedactionPlan } from './redactionPorts';

// ocr-mask được hiệu chỉnh trên ảnh ≤ 2048 px và tự thu nhỏ ảnh lớn hơn (HL-24).
const MAX_SIDE = 2048;
const FULL = { left: 0, top: 0, width: 1_000_000, height: 1_000_000 };

/** SPEC-083: ảnh đã xoay, toàn ảnh, không che — toạ độ trả về khớp hệ PrivacyEdits (tính trên ảnh đã xoay). */
export function planSuggestionImage(size: ImageSize, rotation: PrivacyEdits['rotation']): RedactionPlan {
  const plan = planRedaction(size, { rotation, crop: FULL, masks: [] });
  return { ...plan, scale: Math.min(1, MAX_SIDE / Math.max(plan.crop.width, plan.crop.height)) };
}
