import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const repoUrl = (path: string) => new URL(`../${path}`, import.meta.url);

describe('index.html web tuân thủ CSP script-src self', () => {
  it('TC-856: không có script inline; script khôi phục nền chạy đồng bộ trong head trước bundle', () => {
    const html = readFileSync(repoUrl('apps/web/index.html'), 'utf8');
    const scripts = html.match(/<script\b[^>]*>/g) ?? [];

    expect(scripts.filter((tag) => !/\bsrc=/.test(tag))).toEqual([]);
    const head = html.split('</head>')[0] ?? '';
    expect(head).toContain('<script src="/theme-init.js"></script>');
    expect(existsSync(repoUrl('apps/web/public/theme-init.js'))).toBe(true);
  });
});
