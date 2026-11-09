import { desc } from 'drizzle-orm';
import { painIssues, painEntries } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { findProfileInFamily } from '@src/features/profiles/infrastructure/findProfileInFamily.js';
import type { StoredPainIssue } from '../application/ports.js';
import { painIssueWhere } from './painIssueWhere.js';
import { painChildWhere } from './painChildWhere.js';

export async function findStoredPainIssue(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  issueId: string,
  lock: boolean,
): Promise<StoredPainIssue | null> {
  const query = tx
    .select()
    .from(painIssues)
    .where(painIssueWhere(familyId, profileId, issueId));
  const row = (await (lock ? query.for('update') : query))[0];
  if (!row) return null;
  // Đọc sau khi lấy khóa cha để thấy commit của lệnh ghi vừa chờ xong.
  const last = (
    await tx
      .select({ recordedAt: painEntries.recordedAt })
      .from(painEntries)
      .where(painChildWhere(painEntries, familyId, profileId, issueId))
      .orderBy(desc(painEntries.recordedAt), desc(painEntries.id))
      .limit(1)
  )[0];
  const profile = await findProfileInFamily(tx, familyId, profileId);
  if (!last || !profile) throw new Error('Vấn đề đau thiếu hồ sơ hoặc lần ghi');
  const base = {
    id: row.id,
    healthProfileId: row.healthProfileId,
    region: row.region,
    side: row.side,
    title: row.title,
  };
  if (row.status === 'resolved' && row.resolvedOn === null) throw new Error('Vấn đề đã khỏi thiếu ngày khỏi');
  const issue =
    row.status === 'resolved'
      ? { ...base, status: 'resolved' as const, resolvedOn: row.resolvedOn! }
      : { ...base, status: 'tracking' as const, resolvedOn: null };
  return { issue, consentStatus: profile.consentStatus, lastRecordedAt: last.recordedAt.toISOString() };
}
