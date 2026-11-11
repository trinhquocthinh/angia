import type { PrivacyRectangle } from '@angia/contracts';
import { RedactionSuggestionError, type SuggestionFailure } from './redactionSuggestionPorts';

export type SuggestionStatus =
  | { kind: 'idle' | 'loading' }
  | { kind: 'done'; added: number; dropped: number }
  | { kind: 'error'; reason: SuggestionFailure };

type Input = {
  exportImage(): Promise<Blob>;
  suggest(image: Blob, signal: AbortSignal): Promise<PrivacyRectangle[]>;
  signal: AbortSignal;
  /** Số chỗ còn trống tính lúc có kết quả: người dùng vẫn vẽ thêm trong lúc chờ. */
  room(): number;
  add(masks: PrivacyRectangle[]): void;
};

// SPEC-083: một lần gọi, không tự gửi lại; huỷ thì trả null để giao diện giữ nguyên.
export async function requestRedactionSuggestions(input: Input): Promise<SuggestionStatus | null> {
  let masks: PrivacyRectangle[];
  try {
    masks = await input.suggest(await input.exportImage(), input.signal);
  } catch (error) {
    if (input.signal.aborted) return null;
    return {
      kind: 'error',
      reason: error instanceof RedactionSuggestionError ? error.reason : 'unavailable',
    };
  }
  if (input.signal.aborted) return null;
  const added = Math.min(masks.length, Math.max(0, input.room()));
  if (masks.length) input.add(masks);
  return { kind: 'done', added, dropped: masks.length - added };
}
