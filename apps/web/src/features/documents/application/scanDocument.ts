import type { PrivacyEdits } from '@angia/contracts';
import { planRedaction } from './planRedaction';
import type { RedactionCodec, RenderedImage } from './redactionPorts';
import type { DocumentScanner } from './scanPorts';
import type { Quad, RgbaImage } from './scanTypes';

const FULL = { left: 0, top: 0, width: 1_000_000, height: 1_000_000 };
const QUALITY = 0.92;

type ScanRequest = {
  file: File;
  rotation: PrivacyEdits['rotation'];
  /** 4 góc chuẩn hoá 0..1 trên ảnh đã xoay — cùng hệ toạ độ người dùng nhìn thấy khi kéo. */
  quad: Quad;
  clean: boolean;
};

// Vẽ ảnh đã xoay toàn khung (≤ 13.000.000 pixel như bản xuất) rồi lấy pixel; giải phóng canvas ngay.
async function readSource(file: File, rotation: ScanRequest['rotation'], codec: RedactionCodec) {
  const image = await codec.decode(file);
  let rendered: RenderedImage;
  try {
    rendered = await codec.render(image, planRedaction(image, { rotation, crop: FULL, masks: [] }));
  } finally {
    image.release();
  }
  try {
    return codec.readPixels(rendered);
  } finally {
    codec.dispose(rendered);
  }
}

async function encode(image: RgbaImage, codec: RedactionCodec): Promise<Blob> {
  const rendered = codec.fromPixels(image);
  try {
    return await codec.encodeJpeg(rendered, QUALITY);
  } finally {
    codec.dispose(rendered);
  }
}

/** SPEC-084: nắn giấy hoàn toàn trên máy; trả JPEG ảnh nắn (vẫn là ảnh chưa che, không gửi đi). */
export async function scanDocument(request: ScanRequest, codec: RedactionCodec, scanner: DocumentScanner) {
  const source = await readSource(request.file, request.rotation, codec);
  const quad = request.quad.map((p) => ({
    x: p.x * source.width,
    y: p.y * source.height,
  })) as unknown as Quad;
  return encode(await scanner.process(source, quad, request.clean), codec);
}
