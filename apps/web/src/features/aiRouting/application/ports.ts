import type { AiRoutingView, UpdateAiRoutingRequest } from '@angia/contracts';

export interface AiRoutingRepository {
  get(signal?: AbortSignal): Promise<AiRoutingView>;
  save(input: UpdateAiRoutingRequest, csrfToken: string): Promise<AiRoutingView>;
}

export interface AiRoutingDraft {
  expectedVersion: number;
  openrouterPrimary: string;
  openrouterFallback: string;
}
export type AiRoutingField = Exclude<keyof AiRoutingDraft, 'expectedVersion'>;
export type AiRoutingErrors = Partial<Record<AiRoutingField, string>>;
