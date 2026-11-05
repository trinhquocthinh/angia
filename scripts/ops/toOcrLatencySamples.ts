import { EXTRACT_QUEUE, SANITIZE_QUEUE, type JobRow } from './readJobRows.js';

export interface OcrLatencySample {
  documentId: string;
  /** Outcome worker trả về (pending_review, manual_entry, awaiting_budget…); `failed`/`unknown` khi không có. */
  outcome: string;
  retryCount: number;
  /** Từ lúc tạo job OCR tới lần nhận việc cuối — gồm cả giãn cách thử lại OCR. */
  queueWaitMs: number;
  durationMs: number;
}

export interface OcrLatencySamples {
  extraction: OcrLatencySample[];
  /** Thời lượng từng job làm sạch, kể cả chứng từ tự nhập (số phụ). */
  sanitization: number[];
}

const outcomeOf = (row: JobRow): string => {
  if (row.state === 'failed') return 'failed';
  const status = (row.output as { status?: unknown } | null)?.status;
  return typeof status === 'string' ? status : 'unknown';
};

// KH-2/TC-439: đo từ lúc tạo job làm sạch tới khi OCR đầu tiên hoàn tất; không tính lại khi xếp lại OCR.
export function toOcrLatencySamples(rows: readonly JobRow[]): OcrLatencySamples {
  const finished = rows.filter((row) => row.completedOn !== null);
  const sanitizers = new Map(
    finished
      .filter((row) => row.name === SANITIZE_QUEUE && row.documentId)
      .map((row) => [row.documentId, row]),
  );
  const firstByDocument = new Map<string, JobRow>();
  for (const row of finished) {
    if (row.name !== EXTRACT_QUEUE || !row.documentId) continue;
    const current = firstByDocument.get(row.documentId);
    if (!current || row.createdOn < current.createdOn) firstByDocument.set(row.documentId, row);
  }
  const extraction = [...firstByDocument.values()].flatMap((row) => {
    const sanitizer = sanitizers.get(row.documentId);
    if (!sanitizer) return [];
    return [
      {
        documentId: row.documentId ?? '',
        outcome: outcomeOf(row),
        retryCount: row.retryCount,
        queueWaitMs: (row.startedOn ?? row.createdOn).getTime() - row.createdOn.getTime(),
        durationMs: (row.completedOn ?? row.createdOn).getTime() - sanitizer.createdOn.getTime(),
      },
    ];
  });
  const sanitization = finished
    .filter((row) => row.name === SANITIZE_QUEUE)
    .map((row) => (row.completedOn ?? row.createdOn).getTime() - row.createdOn.getTime());
  return { extraction, sanitization };
}
