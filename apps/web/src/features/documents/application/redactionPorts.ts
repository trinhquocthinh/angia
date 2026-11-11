import type { PrivacyEdits } from '@angia/contracts';
import type { RgbaImage } from './scanTypes';

export interface PixelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}
export interface ImageSize {
  width: number;
  height: number;
}
/** Hình học xuất ảnh: mọi tọa độ tính trên ảnh đã xoay `rotation`. */
export interface RedactionPlan {
  rotation: PrivacyEdits['rotation'];
  rotated: ImageSize;
  masks: PixelRect[];
  crop: PixelRect;
  scale: number;
}
export interface DecodedImage extends ImageSize {
  release(): void;
}
export type RenderedImage = ImageSize;

export interface RedactionCodec {
  /** Kích thước trả về là sau khi đã xoay theo EXIF (đúng ảnh người dùng nhìn thấy khi che). */
  decode(file: File): Promise<DecodedImage>;
  render(image: DecodedImage, plan: RedactionPlan): Promise<RenderedImage>;
  encodeJpeg(rendered: RenderedImage, quality: number): Promise<Blob>;
  dispose(rendered: RenderedImage): void;
  /** SPEC-084: đọc pixel của ảnh đã vẽ để nắn; vẽ lại kết quả để mã hoá JPEG. */
  readPixels(rendered: RenderedImage): RgbaImage;
  fromPixels(image: RgbaImage): RenderedImage;
}
