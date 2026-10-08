import { fileURLToPath } from 'node:url';
import { ImageConversionError } from '../application/ImageConversionError.js';
import type { PreviewImageConverter } from '../application/ports.js';
import { runHeicProcess } from './runHeicProcess.js';
import { withImageProcessingSlot } from './withImageProcessingSlot.js';

export function createDocumentPreviewConverter(): PreviewImageConverter {
  const sourceMode = import.meta.url.endsWith('.ts');
  const childPath = fileURLToPath(
    new URL(`./documentPreviewChild.${sourceMode ? 'ts' : 'js'}`, import.meta.url),
  );
  return {
    toWebp: async (bytes, mimeType) => {
      if (
        !['image/heic', 'image/jpeg', 'image/png', 'image/webp'].includes(mimeType) ||
        bytes.byteLength === 0 ||
        bytes.byteLength > 10 * 1024 * 1024
      )
        throw new ImageConversionError();
      const args = sourceMode ? ['--import', 'tsx', childPath, mimeType] : [childPath, mimeType];
      const output = await withImageProcessingSlot(() => runHeicProcess(bytes, args));
      const header = Buffer.from(output.subarray(0, 12));
      if (header.toString('ascii', 0, 4) !== 'RIFF' || header.toString('ascii', 8, 12) !== 'WEBP')
        throw new ImageConversionError();
      return output;
    },
  };
}
