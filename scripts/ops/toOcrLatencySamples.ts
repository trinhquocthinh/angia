import { EXTRACT_QUEUE, PREPARE_QUEUE, type JobRow } from './readJobRows.js';

export interface OcrLatencySample {
  documentId: string;
  /** Outcome worker trả về (pending_review, manual_entry, awaiting_budget…); `failed`/`unknown` khi không có. */
  outcome: string;
  retryCount: number;
  /** Từ lúc tạo job tới lần nhận việc cuối — gồm cả giãn cách thử lại. */
  queueWaitMs: number;
  durationMs: number;
}

export interface OcrLatencySamples {
  extraction: OcrLatencySample[];
  /** Thời lượng từng job chuẩn bị ảnh OCR (số phụ, không thuộc tiêu chí NFR-3). */
  preparation: number[];
}

const outcomeOf = (row: JobRow): string => {
  if (row.state === 'failed') return 'failed';
  const status = (row.output as { status?: unknown } | null)?.status;
  return typeof status === 'string' ? status : 'unknown';
};

// NFR-3 (chủ dự án chốt 2026-10-19): đo từ lúc người dùng duyệt riêng tư — API tạo job extract-document
// cùng transaction — tới lúc job hoàn tất. Mỗi chứng từ lấy job đầu tiên; job xếp lại sau đó không tính.
export function toOcrLatencySamples(rows: readonly JobRow[]): OcrLatencySamples {
  const finished = rows.filter((row) => row.completedOn !== null);
  const firstByDocument = new Map<string, JobRow>();
  for (const row of finished) {
    if (row.name !== EXTRACT_QUEUE || !row.documentId) continue;
    const current = firstByDocument.get(row.documentId);
    if (!current || row.createdOn < current.createdOn) firstByDocument.set(row.documentId, row);
  }
  const extraction = [...firstByDocument.values()].map((row) => ({
    documentId: row.documentId ?? '',
    outcome: outcomeOf(row),
    retryCount: row.retryCount,
    queueWaitMs: (row.startedOn ?? row.createdOn).getTime() - row.createdOn.getTime(),
    durationMs: (row.completedOn ?? row.createdOn).getTime() - row.createdOn.getTime(),
  }));
  const preparation = finished
    .filter((row) => row.name === PREPARE_QUEUE)
    .map((row) => (row.completedOn ?? row.createdOn).getTime() - row.createdOn.getTime());
  return { extraction, preparation };
}
