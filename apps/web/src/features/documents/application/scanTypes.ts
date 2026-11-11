/** Ảnh RGBA thô — cùng hình dạng ImageData nhưng không phụ thuộc DOM, chạy được trong worker và test. */
export interface RgbaImage {
  width: number;
  height: number;
  data: Uint8ClampedArray<ArrayBuffer>;
}
export interface Point {
  x: number;
  y: number;
}
/** 4 góc tờ giấy theo pixel nguồn: trên-trái, trên-phải, dưới-phải, dưới-trái (SPEC-084). */
export type Quad = readonly [Point, Point, Point, Point];

/** Trần cạnh dài ảnh nắn (SPEC-084, P3). */
export const SCAN_MAX_SIDE = 3000;
