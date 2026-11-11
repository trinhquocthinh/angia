import type { SuggestFn, useRedactionSuggestions } from '../../application/useRedactionSuggestions';
import { type ProfileOption, RedactionSuggestionControl } from './RedactionSuggestionControl';
import { ScanTools } from './ScanTools';

export type StudioSuggest = {
  run: SuggestFn | null;
  choices: ProfileOption[];
  onChooseProfile: (id: string) => void;
};
export type StudioScan = { scanned: boolean; onScanned: (blob: Blob) => void; onUnscan: () => void };

type Input = {
  suggest: StudioSuggest | undefined;
  suggestions: ReturnType<typeof useRedactionSuggestions>;
  scan: StudioScan | undefined;
  hasMasks: boolean;
  onScan: () => void;
};

/** Nút "Gợi ý vùng che" (SPEC-083) và "Nắn giấy" (SPEC-084) đặt dưới thanh công cụ của trình che. */
export function studioSlots({ suggest, suggestions, scan, hasMasks, onScan }: Input) {
  const busy = suggestions.status.kind === 'loading';
  return {
    suggestion: suggest && (
      <RedactionSuggestionControl
        suggestions={suggestions}
        choices={suggest.run ? null : suggest.choices}
        onChooseProfile={suggest.onChooseProfile}
      />
    ),
    tools: scan && (
      <ScanTools
        scanned={scan.scanned}
        disabled={busy}
        hasMasks={hasMasks}
        onScan={onScan}
        onUnscan={scan.onUnscan}
      />
    ),
  };
}
