import { z } from 'zod';
import { V1FamilyOwnersError } from './V1FamilyOwnersError.js';

const uuidMap = z.record(z.uuid(), z.uuid());

function parseMap(input: unknown, label: string): Record<string, string> {
  const parsed = uuidMap.safeParse(input);
  if (!parsed.success) throw new V1FamilyOwnersError(`${label}: cần bảng ánh xạ UUID sang UUID.`);
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    const normalized = key.toLowerCase();
    if (normalized in result) throw new V1FamilyOwnersError(`${label}: khoá UUID trùng lặp.`);
    result[normalized] = value.toLowerCase();
  }
  return result;
}

export function parseV1FamilyMapping(owners: unknown, creators: unknown) {
  const result = { owners: parseMap(owners, 'Chủ hộ'), creators: parseMap(creators, 'Người tạo') };
  if (!Object.keys(result.owners).length) throw new V1FamilyOwnersError('Ánh xạ Chủ hộ không được rỗng.');
  return result;
}

export type V1FamilyMapping = ReturnType<typeof parseV1FamilyMapping>;
