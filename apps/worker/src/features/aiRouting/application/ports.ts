import type { AiRoutingView } from '@angia/contracts';
import type { ExtractionDependencies } from '@src/features/extraction/application/ports.js';

export type AiRunMode = 'fake' | 'live';
export interface AiRoutingReader {
  read(): Promise<AiRoutingView>;
}
/** Bản chốt trong bộ nhớ của một lượt xử lý; không đại diện sổ phí tổng của provider. */
export interface ExtractionSnapshot {
  readonly runMode: AiRunMode;
  readonly provider: 'openrouter';
  readonly primaryModel: string;
  readonly fallbackModel: string;
  readonly month: string;
  readonly version: number;
}
export interface ExtractionAttemptProvider {
  prepare(): Promise<{ dependencies: ExtractionDependencies; snapshot: ExtractionSnapshot }>;
}
