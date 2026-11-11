import { mergeSuggestionMasks } from '../domain/mergeSuggestionMasks.js';
import { MAX_SUGGESTIONS, type SuggestionRect } from '../domain/SuggestionRect.js';
import { toSuggestionRect } from '../domain/toSuggestionRect.js';
import type { RedactionSuggestionDependencies } from './redactionSuggestionPorts.js';

type SuggestOutcome =
  { ok: true; masks: SuggestionRect[] } | { ok: false; code: 'ERR_SUGGESTION_UNAVAILABLE' };

// SPEC-083: một lời gọi, không retry. Lỗi chỉ đổi thành mã cố định — message có thể chứa dữ liệu ảnh/OCR.
export async function suggestRedactionMasks(
  deps: RedactionSuggestionDependencies | undefined,
  jpeg: Uint8Array,
  signal: AbortSignal,
): Promise<SuggestOutcome> {
  if (!deps) return { ok: false, code: 'ERR_SUGGESTION_UNAVAILABLE' };
  const started = Date.now();
  let boxes;
  try {
    boxes = await deps.analyzer.analyze(jpeg, signal);
  } catch {
    deps.logger.info({ outcome: 'unavailable', ms: Date.now() - started }, 'Gợi ý vùng che thất bại');
    return { ok: false, code: 'ERR_SUGGESTION_UNAVAILABLE' };
  }
  const masks = mergeSuggestionMasks(boxes.map(toSuggestionRect)).slice(0, MAX_SUGGESTIONS);
  deps.logger.info({ boxes: boxes.length, masks: masks.length, ms: Date.now() - started }, 'Gợi ý vùng che');
  return { ok: true, masks };
}
