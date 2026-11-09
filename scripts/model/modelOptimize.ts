import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * `yarn model:optimize <in.glb>` (Setup §9.3): nén meshopt + lượng tử hóa như E18-S1-T3, ghi đè `body.glb`.
 * shortcut: chưa nén texture WebP vì mô hình hiện không có texture; thêm bước `webp` khi mô hình có texture.
 */
const input = process.argv[2];
if (!input || !existsSync(input)) {
  console.error('Cách dùng: yarn model:optimize <tệp-xuất-từ-Blender.glb>');
  process.exit(1);
}

const output = join(process.cwd(), 'apps/web/src/assets/models/body.glb');
execFileSync('gltf-transform', ['meshopt', resolve(input), output, '--level', 'medium'], {
  stdio: 'inherit',
});

const kb = (path: string) => `${(statSync(path).size / 1024).toFixed(1)} KB`;
console.log(`Trước: ${kb(input)} → sau: ${kb(output)} (${output}).`);
console.log('Tiếp theo: yarn model:check, rồi cập nhật byte và SHA-256 trong PROVENANCE.md.');
