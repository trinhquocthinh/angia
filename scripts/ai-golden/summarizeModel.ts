import type { ExtractionPayload } from '@angia/contracts';
import type { FieldScore } from './scoreExtraction.js';

/** Ngưỡng R1 (Master Plan §2): dưới 70% trường đúng → dừng UC1. */
const ACCURACY_THRESHOLD = 0.7;

export interface CaseResult {
  caseId: string;
  /** Định danh model trên OpenRouter, ví dụ `moonshotai/kimi-k2.6`. */
  model: string;
  score: FieldScore;
  /** Lý do thất bại (lỗi mạng, `invalid_json`, `schema_mismatch`) hoặc `null` khi parse được. */
  failure: string | null;
  costUsd: number;
  latencyMs: number;
  /** Payload model trả về (đã qua schema) để đối chiếu với đáp án; `null` khi lỗi. */
  output: ExtractionPayload | null;
}

export interface ModelSummary {
  model: string;
  cases: number;
  failedCases: number;
  correctFields: number;
  totalFields: number;
  accuracy: number;
  meetsThreshold: boolean;
  totalCostUsd: number;
  avgCostPerImageUsd: number;
  avgLatencyMs: number;
}

const sum = (values: number[]): number => values.reduce((acc, value) => acc + value, 0);

export const summarizeModel = (model: string, results: CaseResult[]): ModelSummary => {
  const own = results.filter((result) => result.model === model);
  const cases = own.length;
  const correctFields = sum(own.map((result) => result.score.correct));
  const totalFields = sum(own.map((result) => result.score.total));
  const accuracy = totalFields === 0 ? 0 : correctFields / totalFields;
  const totalCostUsd = sum(own.map((result) => result.costUsd));
  return {
    model,
    cases,
    failedCases: own.filter((result) => result.failure !== null).length,
    correctFields,
    totalFields,
    accuracy,
    meetsThreshold: accuracy >= ACCURACY_THRESHOLD,
    totalCostUsd,
    avgCostPerImageUsd: cases === 0 ? 0 : totalCostUsd / cases,
    avgLatencyMs: cases === 0 ? 0 : sum(own.map((result) => result.latencyMs)) / cases,
  };
};
