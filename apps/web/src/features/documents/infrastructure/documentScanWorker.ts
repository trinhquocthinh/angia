import { processScan } from '../application/processScan';
import type { Quad, RgbaImage } from '../application/scanTypes';

type ScanJob = { image: RgbaImage; quad: Quad; clean: boolean };

// SPEC-084: phép tính pixel chạy ngoài luồng giao diện; trả buffer theo kiểu chuyển giao (không sao chép).
self.onmessage = (event: MessageEvent<ScanJob>) => {
  try {
    const { image, quad, clean } = event.data;
    const out = processScan(image, quad, clean);
    postMessage({ ok: true, image: out }, { transfer: [out.data.buffer] });
  } catch {
    postMessage({ ok: false });
  }
};
