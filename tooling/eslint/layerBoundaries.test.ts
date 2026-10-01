import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

// Lint mã giả lập tại đường dẫn thật trong monorepo để chứng minh luật tầng chặn được import qua alias.
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const eslint = new ESLint({ cwd: repoRoot });

async function ruleIdsFor(relativePath: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: `${repoRoot}/${relativePath}` });
  return (result?.messages ?? []).map((message) => message.ruleId ?? 'fatal');
}

describe('Luật cô lập tầng Clean Architecture', () => {
  it('chặn domain import infrastructure qua alias @src', async () => {
    const ids = await ruleIdsFor(
      'apps/api/src/features/health/domain/fixture.ts',
      "export { createPostgresProbe } from '@src/features/health/infrastructure/createPostgresProbe.js';\n",
    );
    expect(ids).toContain('import/no-restricted-paths');
  });

  it('chặn application import infrastructure qua alias @src (api)', async () => {
    const ids = await ruleIdsFor(
      'apps/api/src/features/health/application/fixture.ts',
      "export { createS3BucketProbe } from '@src/features/health/infrastructure/createS3BucketProbe.js';\n",
    );
    expect(ids).toContain('import/no-restricted-paths');
  });

  it('chặn application import infrastructure qua alias @src (web)', async () => {
    const ids = await ruleIdsFor(
      'apps/web/src/features/welcome/application/fixture.ts',
      "export { fetchHealth } from '@src/features/welcome/infrastructure/fetchHealth';\n",
    );
    expect(ids).toContain('import/no-restricted-paths');
  });

  it('chặn domain import package bên ngoài', async () => {
    const ids = await ruleIdsFor(
      'apps/api/src/features/health/domain/fixture.ts',
      "import { z } from 'zod';\nexport const schema = z.string();\n",
    );
    expect(ids).toContain('no-restricted-imports');
  });

  it('chặn app này import mã của app khác', async () => {
    const ids = await ruleIdsFor(
      'apps/web/src/features/welcome/domain/fixture.ts',
      "export { summarizeHealth } from '../../../../../api/src/features/health/domain/summarizeHealth.js';\n",
    );
    expect(ids).toContain('import/no-restricted-paths');
  });

  it('cho phép application import domain qua alias @src', async () => {
    const ids = await ruleIdsFor(
      'apps/api/src/features/health/application/fixture.ts',
      "export { summarizeHealth } from '@src/features/health/domain/summarizeHealth.js';\n",
    );
    expect(ids).toEqual([]);
  });
});

describe('Luật kích thước và vai trò tệp', () => {
  it('chặn index.ts chứa logic', async () => {
    const ids = await ruleIdsFor('packages/contracts/src/index.ts', 'export const answer = 42;\n');
    expect(ids).toContain('no-restricted-syntax');
  });

  it('chặn tệp vượt 250 dòng code', async () => {
    const code = Array.from({ length: 251 }, (_, index) => `export const value${index} = ${index};`).join(
      '\n',
    );
    const ids = await ruleIdsFor('apps/api/src/shared/fixture.ts', `${code}\n`);
    expect(ids).toContain('max-lines');
  });

  it('chặn hàm vượt 60 dòng', async () => {
    const body = Array.from({ length: 61 }, (_, index) => `  const value${index} = ${index};`).join('\n');
    const ids = await ruleIdsFor('apps/api/src/shared/fixture.ts', `export function big() {\n${body}\n}\n`);
    expect(ids).toContain('max-lines-per-function');
  });
});
