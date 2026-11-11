import type { PrivacyEdits } from '@angia/contracts';
import { planSuggestionImage } from './planSuggestionImage';
import type { RedactionCodec, RenderedImage } from './redactionPorts';

// JPEG từ canvas nên không mang EXIF/GPS của ảnh gốc.
export async function exportSuggestionJpeg(
  file: File,
  rotation: PrivacyEdits['rotation'],
  codec: RedactionCodec,
): Promise<Blob> {
  const image = await codec.decode(file);
  let rendered: RenderedImage;
  try {
    rendered = await codec.render(image, planSuggestionImage(image, rotation));
  } finally {
    image.release();
  }
  try {
    return await codec.encodeJpeg(rendered, 0.9);
  } finally {
    codec.dispose(rendered);
  }
}
