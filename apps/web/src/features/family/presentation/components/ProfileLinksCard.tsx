import { useState } from 'react';
import { linkCandidates } from '../../application/linkCandidates';
import type { Account, Family } from '../../application/ports';
import { useProfileLinks } from '../../application/useProfileLinks';
import { createProfileLinkAdminRepository } from '../../infrastructure/createProfileLinkAdminRepository';
import { AdminCardHeading } from './AdminCardHeading';
import { AdminIcon } from './AdminIcon';
import { AdminSelect } from './AdminSelect';
import { ProfileLinkList } from './ProfileLinkList';

const repository = createProfileLinkAdminRepository();
// SPEC-050, BR-003: chỉ hiện tên hồ sơ và tên tài khoản liên kết, không có dữ liệu sức khỏe.
export function ProfileLinksCard({
  families,
  accounts,
  csrfToken,
}: {
  families: Family[];
  accounts: Account[];
  csrfToken: string;
}) {
  const [familyId, setFamilyId] = useState('');
  const { profiles, change } = useProfileLinks(repository, csrfToken, familyId);
  const rows = profiles.data ?? [];
  const candidates = linkCandidates(accounts, familyId, rows);
  return (
    <section
      className="admin-panel flex min-w-0 flex-col gap-4 rounded-2xl bg-surface p-5 shadow-sm max-[600px]:p-4 admin-reveal"
      aria-labelledby="profile-links-title"
    >
      <AdminCardHeading
        id="profile-links-title"
        icon={<AdminIcon name="group" />}
        title="Liên kết tài khoản với hồ sơ"
      />
      <label className="grid gap-2 text-[13px] font-medium">
        Nhóm gia đình
        <AdminSelect
          value={familyId}
          onChange={(event) => {
            change.reset();
            setFamilyId(event.target.value);
          }}
        >
          <option value="">Chọn nhóm</option>
          {families.map((family) => (
            <option key={family.id} value={family.id}>
              {family.name}
            </option>
          ))}
        </AdminSelect>
      </label>
      <ProfileLinkList
        rows={rows}
        loading={profiles.isFetching && !profiles.data}
        error={profiles.error ?? change.error}
        empty={Boolean(familyId) && profiles.isSuccess && rows.length === 0}
        candidates={candidates}
        pending={change.isPending}
        onChange={(profileId, accountId) => {
          change.reset();
          change.mutate({ profileId, accountId });
        }}
      />
    </section>
  );
}
