import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { readLegalManifest } from './readLegalManifest.js';

it('TC-752: manifest thực chỉ chứa placeholder và sha256 khớp byte nội dung', async () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const docs = await readLegalManifest(root);
  expect(docs.map((d) => d.kind).sort()).toEqual(['privacy', 'terms']);
  for (const doc of docs) {
    const bytes = await readFile(join(root, doc.contentPath));
    expect(bytes.toString('utf8')).toMatch(/^BẢN NHÁP CHƯA ĐƯỢC LUẬT SƯ DUYỆT — KHÔNG DÙNG CHO PRODUCTION/);
    expect(doc.sha256).toBe(createHash('sha256').update(bytes).digest('hex'));
    expect(doc).toMatchObject({ version: '0.0-draft', material: true });
  }
});
it('TC-752: không đọc symlink trỏ ra ngoài thư mục legal', async () => {
  const root = await mkdtemp(join(tmpdir(), 'angia-legal-'));
  try {
    await mkdir(join(root, 'legal'));
    await writeFile(join(root, 'outside.md'), 'Bên ngoài');
    await symlink(join(root, 'outside.md'), join(root, 'legal/terms.md'));
    await writeFile(
      join(root, 'legal/manifest.json'),
      JSON.stringify([
        {
          kind: 'terms',
          version: '1',
          publishedAt: '2026-01-01T00:00:00Z',
          material: true,
          file: 'legal/terms.md',
        },
      ]),
    );
    await expect(readLegalManifest(root)).rejects.toThrow('Đường dẫn văn bản phải nằm trong legal/');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
