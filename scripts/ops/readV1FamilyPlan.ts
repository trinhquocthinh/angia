import { sql } from 'drizzle-orm';
import { withFamilyScope, type FamilyScopedTx } from '../../apps/api/src/shared/db/withFamilyScope.js';
import type { V1FamilyMapping } from './parseV1FamilyMapping.js';
import { V1FamilyOwnersError } from './V1FamilyOwnersError.js';

interface GuardianPlan {
  profileId: string;
  accountId: string;
  insert: boolean;
}
interface FamilyPlan {
  familyId: string;
  ownerAccountId: string;
  update: boolean;
  guardians: GuardianPlan[];
}

async function readGuardians(
  tx: FamilyScopedTx,
  familyId: string,
  owner: string,
  creators: Record<string, string>,
) {
  return withFamilyScope(tx, familyId, async (scoped) => {
    const { rows } = await scoped.execute<{ id: string; creator_eligible: boolean; guardians: string[] }>(sql`
      SELECT p.id, EXISTS(SELECT 1 FROM public.accounts a
        WHERE a.id = (${JSON.stringify(creators)}::jsonb ->> p.id::text)::uuid
          AND a.family_id = p.family_id AND a.family_role = 'main') AS creator_eligible,
        ARRAY(SELECT g.account_id::text FROM public.profile_guardians g
          WHERE g.health_profile_id = p.id AND g.family_id = ${familyId}::uuid ORDER BY g.account_id) AS guardians
      FROM public.health_profiles p WHERE p.family_id = ${familyId}::uuid
        AND extract(year FROM now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::int - p.birth_year < 18
        AND NOT EXISTS(SELECT 1 FROM public.accounts a WHERE a.health_profile_id = p.id) ORDER BY p.id`);
    return rows.map((p): GuardianPlan => {
      if (!creators[p.id]) throw new V1FamilyOwnersError('Thiếu căn cứ người tạo hồ sơ cần giám hộ.');
      const accountId = p.creator_eligible ? creators[p.id]! : owner;
      if (p.guardians.length && (p.guardians.length !== 1 || p.guardians[0] !== accountId))
        throw new V1FamilyOwnersError('Giám hộ đã gán khác ánh xạ; dừng để owner đối chiếu.');
      return { profileId: p.id, accountId, insert: p.guardians.length === 0 };
    });
  });
}

export async function readV1FamilyPlan(tx: FamilyScopedTx, mapping: V1FamilyMapping): Promise<FamilyPlan[]> {
  const { rows: families } = await tx.execute<{ id: string; owner_account_id: string | null }>(sql`
    SELECT id,owner_account_id FROM public.families ORDER BY id`);
  if (families.length !== Object.keys(mapping.owners).length || families.some((f) => !mapping.owners[f.id]))
    throw new V1FamilyOwnersError('Ánh xạ phải khớp đủ các nhà hiện có, không thiếu hoặc thừa nhà.');
  const plans: FamilyPlan[] = [];
  for (const f of families) {
    const owner = mapping.owners[f.id]!;
    const { rows } = await tx.execute(sql`SELECT id FROM public.accounts
      WHERE id = ${owner}::uuid AND family_id = ${f.id}::uuid AND family_role = 'main'`);
    if (!rows.length) throw new V1FamilyOwnersError('Chủ hộ phải là main cùng nhà.');
    if (f.owner_account_id && f.owner_account_id !== owner)
      throw new V1FamilyOwnersError('Chủ hộ đã gán khác ánh xạ; không tự chuyển quyền.');
    plans.push({
      familyId: f.id,
      ownerAccountId: owner,
      update: f.owner_account_id === null,
      guardians: await readGuardians(tx, f.id, owner, mapping.creators),
    });
  }
  const needed = new Set(plans.flatMap((p) => p.guardians.map((g) => g.profileId)));
  if (Object.keys(mapping.creators).some((id) => !needed.has(id)))
    throw new V1FamilyOwnersError('Ánh xạ người tạo có hồ sơ thừa hoặc không thuộc diện cần giám hộ.');
  return plans;
}
