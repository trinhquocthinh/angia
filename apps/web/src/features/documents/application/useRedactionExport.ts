import type { PrivacyEdits } from '@angia/contracts';
import { useEffect, useState } from 'react';
import { exportRedactedJpeg } from './exportRedactedJpeg';
import type { RedactionCodec } from './redactionPorts';

type ExportState =
  | { state: 'exporting'; blob: null; url: null; problem: null }
  | { state: 'ready'; blob: Blob; url: string; problem: null }
  | { state: 'failed'; blob: null; url: null; problem: 'decode_failed' | 'too_large' };

const EXPORTING: ExportState = { state: 'exporting', blob: null, url: null, problem: null };

// Gắn khi mở bước "Xem bản sẽ tải lên" (mỗi lần mở là một lần xuất); tự thu hồi object URL khi rời bước.
export function useRedactionExport(file: File, edits: PrivacyEdits, codec: RedactionCodec): ExportState {
  const [result, setResult] = useState<ExportState>(EXPORTING);
  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    void exportRedactedJpeg(file, edits, codec).then((exported) => {
      if (cancelled) return;
      if (!exported.ok)
        return setResult({ state: 'failed', blob: null, url: null, problem: exported.problem });
      url = URL.createObjectURL(exported.blob);
      setResult({ state: 'ready', blob: exported.blob, url, problem: null });
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file, edits, codec]);
  return result;
}
