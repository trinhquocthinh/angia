import { fileURLToPath } from 'node:url';
import { ImageConversionError } from '../../extraction/application/ImageConversionError.js';
import { runHeicProcess } from '../../extraction/infrastructure/runHeicProcess.js';
import { withImageProcessingSlot } from '../../extraction/infrastructure/withImageProcessingSlot.js';
import type { PrivacyImageRenderer } from '../application/ports.js';
import { validatePrivacyEdits } from '../domain/validatePrivacyEdits.js';
const MAX_BYTES = 10 * 1024 * 1024;
const PNG_HEADER = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
export function createPrivacyImageRenderer(): PrivacyImageRenderer {
  const sourceMode = import.meta.url.endsWith('.ts');
  const childPath = fileURLToPath(new URL(`./privacyPngChild.${sourceMode ? 'ts' : 'js'}`, import.meta.url));
  return {
    toPng: async (bytes, mimeType, edits) => {
      if (
        !['image/heic', 'image/jpeg', 'image/png', 'image/webp'].includes(mimeType) ||
        bytes.byteLength === 0 ||
        bytes.byteLength > MAX_BYTES
      )
        throw new ImageConversionError();
      validatePrivacyEdits(edits);
      const params = [childPath, mimeType, JSON.stringify(edits)];
      const args = sourceMode ? ['--import', 'tsx', ...params] : params;
      const output = await withImageProcessingSlot(() => runHeicProcess(bytes, args, 30_000, MAX_BYTES));
      if (output.byteLength > MAX_BYTES || !PNG_HEADER.equals(Buffer.from(output.subarray(0, 8))))
        throw new ImageConversionError();
      return output;
    },
  };
}
