import type { PrivacyEdits, PrivacyRectangle } from '@angia/contracts';
import { useEffect, useRef, useState } from 'react';
import { exportSuggestionJpeg } from './exportSuggestionJpeg';
import { MAX_MASKS, type PrivacyEditorAction } from './privacyEditorState';
import type { RedactionCodec } from './redactionPorts';
import { requestRedactionSuggestions, type SuggestionStatus } from './requestRedactionSuggestions';

export type SuggestFn = (image: Blob, signal: AbortSignal) => Promise<PrivacyRectangle[]>;

type Options = {
  file: File;
  edits: PrivacyEdits;
  codec: RedactionCodec;
  /** null khi chưa chọn hồ sơ đã đồng thuận: API cần hồ sơ để kiểm đồng thuận. */
  suggest: SuggestFn | null;
  dispatch: (action: PrivacyEditorAction) => void;
};

// SPEC-083: rời trình che hoặc đổi ảnh (component bị gỡ) thì huỷ yêu cầu đang chờ.
export function useRedactionSuggestions({ file, edits, codec, suggest, dispatch }: Options) {
  const [status, setStatus] = useState<SuggestionStatus>({ kind: 'idle' });
  const controller = useRef<AbortController | null>(null);
  const masks = useRef(edits.masks.length);
  useEffect(() => {
    masks.current = edits.masks.length;
  }, [edits.masks.length]);
  useEffect(() => () => controller.current?.abort(), []);
  const run = () => {
    if (!suggest) return;
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setStatus({ kind: 'loading' });
    void requestRedactionSuggestions({
      exportImage: () => exportSuggestionJpeg(file, edits.rotation, codec),
      suggest,
      signal: current.signal,
      room: () => MAX_MASKS - masks.current,
      add: (rectangles) => dispatch({ type: 'add-masks', rectangles }),
    }).then((next) => next && setStatus(next));
  };
  const cancel = () => {
    controller.current?.abort();
    setStatus({ kind: 'idle' });
  };
  return { status, run, cancel };
}
