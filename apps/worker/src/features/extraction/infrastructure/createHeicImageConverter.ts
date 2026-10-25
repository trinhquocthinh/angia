import { fileURLToPath } from 'node:url';
import { ImageConversionError } from '../application/ImageConversionError.js';
import type { ImageConverter } from '../application/ports.js';
import { withImageProcessingSlot } from './withImageProcessingSlot.js';
import { runHeicProcess } from './runHeicProcess.js';

export function createHeicImageConverter(): ImageConverter {
  const sourceMode = import.meta.url.endsWith('.ts');
  const childPath = fileURLToPath(
    new URL(`./heicConversionChild.${sourceMode ? 'ts' : 'js'}`, import.meta.url),
  );
  const args = sourceMode ? ['--import', 'tsx', childPath] : [childPath];
  return {
    heicToJpeg: async (bytes) => {
      if (bytes.byteLength === 0 || bytes.byteLength > 10 * 1024 * 1024) throw new ImageConversionError();
      const output = await withImageProcessingSlot(() => runHeicProcess(bytes, args));
      if (output[0] !== 0xff || output[1] !== 0xd8) throw new ImageConversionError();
      return output;
    },
  };
}
