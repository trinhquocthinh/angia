import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readRepoFile = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('Văn bản pháp lý trong image web', () => {
  it('TC-752: phục vụ công khai đúng văn bản trong manifest, không fallback SPA và đủ header bảo mật', () => {
    const manifest = JSON.parse(readRepoFile('legal/manifest.json')) as { file: string }[];
    const dockerfile = readRepoFile('apps/web/Dockerfile');
    const runtime = dockerfile.split(/^FROM .+ AS runtime\s*$/m)[1] ?? '';
    const legalCopies = dockerfile.match(/^COPY\s+[^\n]*\blegal(?:\/|\s)[^\n]*$/gm) ?? [];
    const expectedCopies = manifest.map(({ file }) => `COPY ${file} /usr/share/nginx/html/legal/`);

    expect.soft(legalCopies.sort()).toEqual(expectedCopies.sort());
    for (const copy of expectedCopies) {
      expect.soft(runtime.split('\n')).toContain(copy);
    }

    const nginx = readRepoFile('apps/web/nginx.conf');
    const legalLocation = nginx.match(/location\s+\^~\s+\/legal\/\s*\{([\s\S]*?)^ {4}\}/m)?.[1] ?? '';
    expect.soft(legalLocation).toMatch(/try_files\s+\$uri\s+=404\s*;/);
    expect.soft(legalLocation).toMatch(/types\s*\{\s*\}/);
    expect.soft(legalLocation).toMatch(/default_type\s+"text\/plain;\s*charset=utf-8"\s*;/);
    expect.soft(legalLocation).toMatch(/add_header\s+Cache-Control\s+"no-cache"\s*;/);
    for (const [name, value] of [
      ['X-Content-Type-Options', 'nosniff'],
      ['Referrer-Policy', 'same-origin'],
      ['X-Frame-Options', 'DENY'],
    ]) {
      expect.soft(legalLocation).toContain(`add_header ${name} "${value}" always;`);
    }
  });
});
