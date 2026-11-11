import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ESLint } from 'eslint';
import { expect, it } from 'vitest';

const eslint = new ESLint();

it.each([
  '<div className="bg-[#fff]" />',
  '<div className="shadow-[0_2px_8px_rgba(1,2,3,.5)]" />',
  '<svg fill="#aabbccdd" />',
  'const classes = `hover:text-white ${active}`;',
  'const color = "rgba(1, 2, 3, .5)";',
  'const image = "%23404945";',
])('TC-860 — lint chặn màu cứng trong mã giao diện: %s', async (code) => {
  const [result] = await eslint.lintText(code, { filePath: 'apps/web/src/shared/ui/fixture.tsx' });
  expect(result!.messages.map((message) => message.ruleId)).toContain('theme/no-hardcoded-colors');
});

it('TC-860 — lint cho phép token, kích thước và currentColor', async () => {
  const [result] = await eslint.lintText(
    'export const icon = <svg className="bg-surface text-accent w-[48px]" fill="currentColor" />;',
    { filePath: 'apps/web/src/shared/ui/fixture.tsx' },
  );
  expect(result!.messages.filter((message) => message.ruleId === 'theme/no-hardcoded-colors')).toEqual([]);
});

function cssFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? cssFiles(path)
      : !entry.name.startsWith('._') && entry.name.endsWith('.css')
        ? [path]
        : [];
  });
}

it('TC-860 — CSS chỉ khai báo màu cứng tại tokens.css', () => {
  const violations = cssFiles('apps/web/src')
    .filter((path) => !path.endsWith('/tokens.css'))
    .flatMap((path) => {
      const code = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      return /(?:#|%23)[\da-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(/i.test(code)
        ? [path]
        : [];
    });
  expect(violations).toEqual([]);
});
