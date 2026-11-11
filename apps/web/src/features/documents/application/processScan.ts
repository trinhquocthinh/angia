import { flattenBackground } from './flattenBackground';
import type { Quad, RgbaImage } from './scanTypes';
import { warpQuadrilateral } from './warpQuadrilateral';

/** SPEC-084: nắn 4 góc, rồi làm sạch nền nếu người dùng để bật. Dùng chung cho worker và luồng chính. */
export function processScan(image: RgbaImage, quad: Quad, clean: boolean): RgbaImage {
  const warped = warpQuadrilateral(image, quad);
  return clean ? flattenBackground(warped) : warped;
}
