import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { withImageProcessingSlot } from '../../extraction/infrastructure/withImageProcessingSlot.js';
import { ImageConversionError } from '../../extraction/application/ImageConversionError.js';
import type { SanitizeDependencies } from '../application/ports.js';
import { runJpegProcess } from './runJpegProcess.js';

export function createJpegSanitizer(): SanitizeDependencies['images'] {
  const sourceMode = import.meta.url.endsWith('.ts');
  const childPath = fileURLToPath(
    new URL(`./sanitizeJpegChild.${sourceMode ? 'ts' : 'js'}`, import.meta.url),
  );
  const args = sourceMode ? ['--import', 'tsx', childPath] : [childPath];
  return {
    sanitize: async (input) => {
      if (!input.byteLength || input.byteLength > 10 * 1024 * 1024) throw new ImageConversionError();
      const bytes = await withImageProcessingSlot(() => runJpegProcess(input, args));
      if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new ImageConversionError();
      return { bytes, sha256: createHash('sha256').update(bytes).digest('hex') };
    },
  };
}
