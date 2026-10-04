import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { extractionPayloadSchema } from './extractionPayloadSchema.js';
import type { ExtractionPayload } from './extractionPayloadSchema.js';

export interface GoldenCase {
  caseId: string;
  imagePath: string;
  mimeType: string;
  expected: ExtractionPayload;
}

const EXPECTED_SUFFIX = '.expected.json';

// HEIC phải chuyển sang JPEG trước: API Vision-LLM không nhận HEIC trực tiếp.
const MIME_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const isImage = (file: string): boolean => extname(file).toLowerCase() in MIME_BY_EXTENSION;
const baseName = (file: string): string => file.slice(0, -extname(file).length);

const loadCase = async (dir: string, files: string[], caseId: string): Promise<GoldenCase> => {
  const image = files.find((file) => isImage(file) && baseName(file) === caseId);
  if (!image) throw new Error(`${caseId}: thiếu ảnh (.jpg/.png/.webp)`);

  const parsed = extractionPayloadSchema.safeParse(
    JSON.parse(await readFile(join(dir, `${caseId}${EXPECTED_SUFFIX}`), 'utf8')),
  );
  if (!parsed.success) throw new Error(`${caseId}: đáp án sai schema — ${parsed.error.message}`);

  return {
    caseId,
    imagePath: join(dir, image),
    mimeType: MIME_BY_EXTENSION[extname(image).toLowerCase()] ?? 'image/jpeg',
    expected: parsed.data,
  };
};

/** Một chứng từ chỉ được chấm một lần: ảnh trùng từng byte làm lệch tỷ lệ đúng. */
const assertNoDuplicateImages = async (cases: GoldenCase[]): Promise<void> => {
  const seen = new Map<string, string>();
  for (const golden of cases) {
    const digest = createHash('sha256')
      .update(await readFile(golden.imagePath))
      .digest('hex');
    const name = golden.imagePath.split('/').pop() ?? golden.imagePath;
    const first = seen.get(digest);
    if (first) throw new Error(`Ảnh trùng nội dung: ${first} = ${name}`);
    seen.set(digest, name);
  }
};

/** Mỗi ca chuẩn gồm `<mã>.<jpg|png|webp>` và đáp án `<mã>.expected.json` theo SDD §2.1. */
export const loadGoldenSet = async (dir: string): Promise<GoldenCase[]> => {
  const files = (await readdir(dir)).sort();
  const caseIds = files
    .filter((file) => file.endsWith(EXPECTED_SUFFIX))
    .map((file) => file.slice(0, -EXPECTED_SUFFIX.length));

  const unlabeled = files.filter((file) => isImage(file) && !caseIds.includes(baseName(file)));
  if (unlabeled.length > 0) throw new Error(`Ảnh chưa có đáp án *.expected.json: ${unlabeled.join(', ')}`);

  const cases = await Promise.all(caseIds.map((caseId) => loadCase(dir, files, caseId)));
  await assertNoDuplicateImages(cases);
  return cases;
};
