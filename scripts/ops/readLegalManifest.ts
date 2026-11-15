import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { parseLegalManifest } from './parseLegalManifest.js';

export async function readLegalManifest(root: string) {
  const entries = parseLegalManifest(
    JSON.parse(await readFile(resolve(root, 'legal/manifest.json'), 'utf8')),
  );
  const legalRoot = await realpath(resolve(root, 'legal'));
  return Promise.all(
    entries.map(async (entry) => {
      const path = await realpath(resolve(root, entry.file));
      if (!path.startsWith(legalRoot + sep)) throw new Error('Đường dẫn văn bản phải nằm trong legal/');
      const contents = await readFile(path);
      return {
        kind: entry.kind,
        version: entry.version,
        publishedAt: new Date(entry.publishedAt),
        material: entry.material,
        contentPath: entry.file,
        sha256: createHash('sha256').update(contents).digest('hex'),
      };
    }),
  );
}
