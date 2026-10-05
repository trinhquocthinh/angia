import type { Measurement } from './parseMeasurement.js';

export interface CaseMeasurement {
  caseId: string;
  pipeline: string;
  result: Measurement;
}

export interface PipelineSummary {
  pipeline: string;
  cases: number;
  succeeded: number;
  avgDurationMs: number | null;
  maxDurationMs: number | null;
  maxRssMb: number;
  meetsThreshold: boolean;
}

// Tech Spec R4: > 30 s/tệp hoặc chạm `mem_limit` 512 MB của angia-worker → chuyển phương án dự phòng.
const MAX_DURATION_MS = 30_000;
const WORKER_MEM_LIMIT_MB = 512;

/** Gộp số đo của một pipeline; đạt khi mọi ảnh chuyển đổi được và đều nằm dưới ngưỡng R4. */
export const summarizePipeline = (pipeline: string, measurements: CaseMeasurement[]): PipelineSummary => {
  const results = measurements.filter((item) => item.pipeline === pipeline).map((item) => item.result);
  const durations = results.filter((result) => result.ok).map((result) => result.durationMs);
  const maxRssMb = Math.max(0, ...results.map((result) => result.maxRssMb));
  const maxDurationMs = durations.length > 0 ? Math.max(...durations) : null;

  return {
    pipeline,
    cases: results.length,
    succeeded: durations.length,
    avgDurationMs:
      durations.length > 0 ? durations.reduce((sum, value) => sum + value, 0) / durations.length : null,
    maxDurationMs,
    maxRssMb,
    meetsThreshold:
      results.length > 0 &&
      durations.length === results.length &&
      maxDurationMs !== null &&
      maxDurationMs <= MAX_DURATION_MS &&
      maxRssMb < WORKER_MEM_LIMIT_MB,
  };
};
