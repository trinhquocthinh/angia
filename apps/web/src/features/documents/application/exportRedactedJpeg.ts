import type { PrivacyEdits } from '@angia/contracts';
import { planRedaction } from './planRedaction';
import type { RedactionCodec, RenderedImage } from './redactionPorts';

const MAX_BYTES = 10 * 1024 * 1024;
const QUALITIES = [0.92, 0.85, 0.78, 0.7] as const;

export type RedactedJpegResult =
  | { ok: true; blob: Blob; width: number; height: number }
  | { ok: false; problem: 'decode_failed' | 'too_large' };

// Lỗi giải mã/vẽ/mã hóa đều là "trình duyệt không xử lý được ảnh" với người dùng → decode_failed.
export async function exportRedactedJpeg(
  file: File,
  edits: PrivacyEdits,
  codec: RedactionCodec,
): Promise<RedactedJpegResult> {
  let rendered: RenderedImage;
  try {
    rendered = await render(file, edits, codec);
  } catch {
    return { ok: false, problem: 'decode_failed' };
  }
  try {
    for (const quality of QUALITIES) {
      const blob = await codec.encodeJpeg(rendered, quality);
      if (blob.size <= MAX_BYTES) return { ok: true, blob, width: rendered.width, height: rendered.height };
    }
    return { ok: false, problem: 'too_large' };
  } catch {
    return { ok: false, problem: 'decode_failed' };
  } finally {
    codec.dispose(rendered);
  }
}

async function render(file: File, edits: PrivacyEdits, codec: RedactionCodec): Promise<RenderedImage> {
  const image = await codec.decode(file);
  try {
    return await codec.render(image, planRedaction(image, edits));
  } finally {
    image.release();
  }
}
