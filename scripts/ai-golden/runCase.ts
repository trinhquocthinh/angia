import type { VisionResponse } from '../../apps/worker/src/features/extraction/infrastructure/callVisionModel.js';
import type { ExtractionPayload } from '@angia/contracts';
import { parseModelJson } from '../../apps/worker/src/features/extraction/infrastructure/parseModelJson.js';
import { scoreExtraction } from './scoreExtraction.js';
import type { CaseResult } from './summarizeModel.js';

export type CallModel = (image: { mimeType: string; base64: string }) => Promise<VisionResponse>;

export interface GoldenInput {
  caseId: string;
  imageBase64: string;
  mimeType: string;
  expected: ExtractionPayload;
}

/** Chạy một ảnh chuẩn qua một model. Lỗi gọi API được ghi nhận thành kết quả 0 điểm, không làm dừng cả lượt. */
export const runCase = async (
  golden: GoldenInput,
  model: string,
  callModel: CallModel,
): Promise<CaseResult> => {
  const base = { caseId: golden.caseId, model };
  try {
    const response = await callModel({ mimeType: golden.mimeType, base64: golden.imageBase64 });
    const parsed = parseModelJson(response.content);
    return {
      ...base,
      score: scoreExtraction(golden.expected, parsed.ok ? parsed.payload : null),
      failure: parsed.ok ? null : parsed.reason,
      costUsd: response.costUsd,
      latencyMs: response.latencyMs,
      output: parsed.ok ? parsed.payload : null,
    };
  } catch (error) {
    return {
      ...base,
      score: scoreExtraction(golden.expected, null),
      failure: error instanceof Error ? error.message : String(error),
      costUsd: 0,
      latencyMs: 0,
      output: null,
    };
  }
};
