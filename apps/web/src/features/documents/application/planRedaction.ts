import type { PrivacyEdits, PrivacyRectangle } from '@angia/contracts';
import type { ImageSize, PixelRect, RedactionPlan } from './redactionPorts';

const UNIT = 1_000_000;
const MAX_PIXELS = 13_000_000;

export function planRedaction(size: ImageSize, edits: PrivacyEdits): RedactionPlan {
  const turned = edits.rotation === 90 || edits.rotation === 270;
  const rotated = turned
    ? { width: size.height, height: size.width }
    : { width: size.width, height: size.height };
  const crop = pixels(edits.crop, rotated, 0);
  return {
    rotation: edits.rotation,
    rotated,
    crop,
    masks: edits.masks.map((mask) => pixels(mask, rotated, 1)),
    scale: Math.min(1, Math.sqrt(MAX_PIXELS / (crop.width * crop.height))),
  };
}

// Làm tròn ra ngoài rồi nới thêm `border` pixel (vùng che), kẹp trong ảnh.
function pixels(rect: PrivacyRectangle, size: ImageSize, border: number): PixelRect {
  const left = Math.max(0, Math.floor((rect.left * size.width) / UNIT) - border);
  const top = Math.max(0, Math.floor((rect.top * size.height) / UNIT) - border);
  const right = Math.min(size.width, Math.ceil(((rect.left + rect.width) * size.width) / UNIT) + border);
  const bottom = Math.min(size.height, Math.ceil(((rect.top + rect.height) * size.height) / UNIT) + border);
  return { left, top, width: right - left, height: bottom - top };
}
