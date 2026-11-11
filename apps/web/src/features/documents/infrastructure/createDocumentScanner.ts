import { processScan } from '../application/processScan';
import type { DocumentScanner } from '../application/scanPorts';
import type { RgbaImage } from '../application/scanTypes';

type WorkerLike = Pick<Worker, 'postMessage' | 'terminate'> & {
  onmessage: ((event: MessageEvent<{ ok: boolean; image?: RgbaImage }>) => void) | null;
  onerror: ((event: unknown) => void) | null;
};

// Vite tách worker thành chunk riêng, chỉ tải khi gọi (SPEC-084 §hiệu năng).
const browserWorker = (): WorkerLike | null =>
  typeof Worker === 'undefined'
    ? null
    : (new Worker(new URL('./documentScanWorker.ts', import.meta.url), { type: 'module' }) as WorkerLike);

/** Mỗi lần nắn một worker, xong thì huỷ; không có Worker thì tính trên luồng chính. */
export function createDocumentScanner(
  createWorker: () => WorkerLike | null = browserWorker,
): DocumentScanner {
  return {
    process: (image, quad, clean) => {
      const worker = createWorker();
      if (!worker) return Promise.resolve(processScan(image, quad, clean));
      return new Promise<RgbaImage>((resolve, reject) => {
        worker.onmessage = (event) => {
          worker.terminate();
          if (event.data.ok && event.data.image) resolve(event.data.image);
          else reject(new Error('Nắn ảnh thất bại'));
        };
        worker.onerror = () => {
          worker.terminate();
          reject(new Error('Nắn ảnh thất bại'));
        };
        worker.postMessage({ image, quad, clean }, [image.data.buffer]);
      });
    },
  };
}
