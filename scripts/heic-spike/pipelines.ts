import { convertViaHeicConvert } from './convertViaHeicConvert.js';
import { convertViaHeicDecode } from './convertViaHeicDecode.js';
import { convertViaSharpNative } from './convertViaSharpNative.js';

export interface ConvertedImage {
  width: number;
  height: number;
  outputBytes: number;
}

export const PIPELINES: Record<string, (input: Buffer) => Promise<ConvertedImage>> = {
  'heic-convert': convertViaHeicConvert,
  'heic-decode': convertViaHeicDecode,
  'sharp-native': convertViaSharpNative,
};
