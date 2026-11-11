import type { PrivacyEdits } from '@angia/contracts';
import { useState } from 'react';
import type { RedactionCodec } from './redactionPorts';
import { scanDocument } from './scanDocument';
import type { DocumentScanner } from './scanPorts';
import type { Quad } from './scanTypes';

type Options = {
  file: File;
  rotation: PrivacyEdits['rotation'];
  codec: RedactionCodec;
  scanner: DocumentScanner;
};

export type ScanStatus = 'idle' | 'working' | 'failed';

/** SPEC-084: nắn giấy trên máy, trả JPEG ảnh nắn; lỗi giải mã/nắn trả null và báo `failed`. */
export function useDocumentScan({ file, rotation, codec, scanner }: Options) {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const run = async (quad: Quad, clean: boolean): Promise<Blob | null> => {
    setStatus('working');
    try {
      const blob = await scanDocument({ file, rotation, quad, clean }, codec, scanner);
      setStatus('idle');
      return blob;
    } catch {
      setStatus('failed');
      return null;
    }
  };
  return { status, run };
}
