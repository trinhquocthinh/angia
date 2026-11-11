import type { PrivacyRectangle } from '@angia/contracts';

/** Lý do không gợi ý được mà giao diện phân biệt (SPEC-083); mọi lỗi khác gộp vào `unavailable`. */
export type SuggestionFailure = 'busy' | 'unavailable';

export class RedactionSuggestionError extends Error {
  constructor(readonly reason: SuggestionFailure) {
    super(reason);
  }
}

export interface RedactionSuggester {
  /** Ném RedactionSuggestionError khi API trả lỗi; AbortError khi bị huỷ. */
  suggest(
    profileId: string,
    image: Blob,
    csrfToken: string,
    signal: AbortSignal,
  ): Promise<PrivacyRectangle[]>;
}
