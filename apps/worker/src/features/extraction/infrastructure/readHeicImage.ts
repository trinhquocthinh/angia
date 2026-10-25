import heicDecode from 'heic-decode';
import { ImageConversionError } from '../application/ImageConversionError.js';

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_PIXELS = 13_000_000;
// @types/heic-decode 2.0 thiếu metadata và dispose của API runtime 2.1.0.
type HeicImages = Array<{
  width: number;
  height: number;
  decode(): Promise<{ width: number; height: number; data: Uint8ClampedArray }>;
}> & { dispose(): void };

export async function readHeicImage(
  bytes: Uint8Array,
): Promise<{ width: number; height: number; data: Uint8ClampedArray }> {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) throw new ImageConversionError();
  let images: HeicImages | undefined;
  try {
    images = (await heicDecode.all({ buffer: bytes })) as HeicImages;
    const image = images[0];
    if (images.length !== 1 || !image || !validDimensions(image.width, image.height)) {
      throw new ImageConversionError();
    }
    const { width, height, data } = await image.decode();
    if (width !== image.width || height !== image.height || data.length !== width * height * 4) {
      throw new ImageConversionError();
    }
    return { width, height, data };
  } catch {
    throw new ImageConversionError();
  } finally {
    images?.dispose();
  }
}

function validDimensions(width: number, height: number): boolean {
  return (
    Number.isSafeInteger(width) &&
    width > 0 &&
    Number.isSafeInteger(height) &&
    height > 0 &&
    width <= MAX_PIXELS / height
  );
}
