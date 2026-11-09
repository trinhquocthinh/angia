import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkBodyModel } from './checkBodyModel.js';
import { readGlbNodeNames } from './readGlbNodeNames.js';

/** `yarn model:check` (TC-731, Setup §C4): kiểm `body.glb` trước khi merge; không có GLB thì bỏ qua. */
const MODELS_DIR = join(process.cwd(), 'apps/web/src/assets/models');
const glbPath = join(MODELS_DIR, 'body.glb');

if (!existsSync(glbPath)) {
  console.log('Bỏ qua model:check: chưa có apps/web/src/assets/models/body.glb (chế độ 3D không dùng).');
  process.exit(0);
}

const glb = readFileSync(glbPath);
const errors = checkBodyModel({
  byteLength: glb.byteLength,
  nodeNames: readGlbNodeNames(glb),
  hasProvenance: existsSync(join(MODELS_DIR, 'PROVENANCE.md')),
});

if (errors.length > 0) {
  console.error(`model:check lỗi:\n${errors.join('\n')}`);
  process.exit(1);
}
console.log(`body.glb đạt: ${(glb.byteLength / 1024).toFixed(1)} KB, đủ 35 node vùng, có PROVENANCE.md.`);
