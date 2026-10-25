import { type FileRejectionCode, MAX_FILE_BYTES } from './SourceDocument.js';

type Classification =
  { ok: true; mimeType: string; extension: string } | { ok: false; code: FileRejectionCode };

const HEIC_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis']);
const HEIF_GENERIC_BRANDS = new Set(['mif1', 'msf1']);

const startsWith = (data: Uint8Array, signature: number[], offset = 0) =>
  data.length >= offset + signature.length && signature.every((byte, i) => data[offset + i] === byte);
const ascii = (data: Uint8Array, from: number, to: number) => String.fromCharCode(...data.subarray(from, to));

// ISO BMFF: [size][ftyp][major brand][minor version][compatible brands...]. AVIF dùng cùng khung nên phải xét brand.
function isHeic(data: Uint8Array): boolean {
  if (data.length < 16 || ascii(data, 4, 8) !== 'ftyp') return false;
  const major = ascii(data, 8, 12);
  if (HEIC_BRANDS.has(major)) return true;
  if (!HEIF_GENERIC_BRANDS.has(major)) return false;
  const boxEnd = Math.min(new DataView(data.buffer, data.byteOffset).getUint32(0), data.length);
  for (let offset = 16; offset + 4 <= boxEnd; offset += 4) {
    if (HEIC_BRANDS.has(ascii(data, offset, offset + 4))) return true;
  }
  return false;
}

function detectFormat(data: Uint8Array): { mimeType: string; extension: string } | null {
  if (startsWith(data, [0xff, 0xd8, 0xff])) return { mimeType: 'image/jpeg', extension: 'jpg' };
  if (startsWith(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mimeType: 'image/png', extension: 'png' };
  }
  if (data.length >= 12 && ascii(data, 0, 4) === 'RIFF' && ascii(data, 8, 12) === 'WEBP') {
    return { mimeType: 'image/webp', extension: 'webp' };
  }
  return isHeic(data) ? { mimeType: 'image/heic', extension: 'heic' } : null;
}

// Nhận diện bằng magic bytes, không tin tên tệp hay Content-Type do client khai (SPEC-008).
// `head` chỉ cần phần đầu tệp; `sizeBytes` là số byte thực nhận.
export function classifyFile(head: Uint8Array, sizeBytes = head.length): Classification {
  if (sizeBytes > MAX_FILE_BYTES) return { ok: false, code: 'ERR_FILE_TOO_LARGE' };
  const format = detectFormat(head);
  return format ? { ok: true, ...format } : { ok: false, code: 'ERR_UNSUPPORTED_FILE' };
}
