import { bodyRegions } from '@angia/contracts';

/** Tech Spec §2.3: trần `body.glb` 1,5 MB (mục tiêu ≤ 800 KB). */
const MAX_BYTES = 1.5 * 1024 * 1024;
const REGION_PREFIX = 'region__';

interface BodyModelFacts {
  byteLength: number;
  nodeNames: string[];
  hasProvenance: boolean;
}

const expectedRegionNodes = Object.entries(bodyRegions).flatMap(([region, { sides }]) =>
  sides.map((side) => `${REGION_PREFIX}${region}__${side}`),
);

/** TC-731: kiểm `body.glb` theo SPEC-051 — mỗi vị trí đúng một node vùng, không node lạ; trả danh sách lỗi. */
export function checkBodyModel({ byteLength, nodeNames, hasProvenance }: BodyModelFacts): string[] {
  const errors: string[] = [];
  if (byteLength > MAX_BYTES)
    errors.push(`body.glb ${byteLength} byte vượt trần 1,5 MB (${MAX_BYTES} byte).`);
  const regionNodes = nodeNames.filter((name) => name.startsWith(REGION_PREFIX));
  for (const name of regionNodes) {
    if (!expectedRegionNodes.includes(name)) errors.push(`Node ${name} không thuộc danh mục SPEC-051.`);
  }
  for (const name of expectedRegionNodes) {
    const count = regionNodes.filter((node) => node === name).length;
    if (count === 0) errors.push(`Thiếu node ${name}.`);
    if (count > 1) errors.push(`Node ${name} xuất hiện ${count} lần, cần đúng một.`);
  }
  if (!hasProvenance) errors.push('Thiếu apps/web/src/assets/models/PROVENANCE.md.');
  return errors;
}
