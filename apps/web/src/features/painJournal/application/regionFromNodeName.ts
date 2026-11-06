import { bodyLocationSchema, type BodyRegion, type BodySide } from '@angia/contracts';

export type BodyLocation = { region: BodyRegion; side: BodySide };

/** Tên node vùng trong `body.glb` (SPEC-051): `region__<code>__<side>`; node khác trả null. */
export function regionFromNodeName(name: string): BodyLocation | null {
  const [prefix, region, side, ...rest] = name.split('__');
  if (prefix !== 'region' || rest.length > 0) return null;
  const parsed = bodyLocationSchema.safeParse({ region, side });
  return parsed.success ? parsed.data : null;
}
