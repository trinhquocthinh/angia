import type { Quad, RgbaImage } from './scanTypes';

/** Phép tính pixel của SPEC-084 (nắn + làm sạch nền); hiện thực chạy trong Web Worker khi có. */
export interface DocumentScanner {
  process(image: RgbaImage, quad: Quad, clean: boolean): Promise<RgbaImage>;
}
