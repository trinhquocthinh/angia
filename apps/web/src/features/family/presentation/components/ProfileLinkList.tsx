import type { Account, AdminProfileLink } from '../../application/ports';
import { ProfileLinkRow } from './ProfileLinkRow';

export function ProfileLinkList({
  rows,
  loading,
  error,
  empty,
  candidates,
  pending,
  onChange,
}: {
  rows: AdminProfileLink[];
  loading: boolean;
  error: Error | null;
  empty: boolean;
  candidates: Account[];
  pending: boolean;
  onChange: (profileId: string, accountId: string | null) => void;
}) {
  return (
    <>
      {loading && (
        <p role="status" className="m-0 text-[13px] text-[#55615f]">
          Đang tải hồ sơ…
        </p>
      )}
      {error && (
        <p role="alert" className="m-0 text-[13px] leading-5 text-[#b42318]">
          {error.message}
        </p>
      )}
      {empty && <p className="m-0 text-[13px] text-[#55615f]">Nhóm này chưa có hồ sơ.</p>}
      {rows.length > 0 && (
        <ul className="m-0 grid list-none gap-3 p-0">
          {rows.map((profile) => (
            <ProfileLinkRow
              key={`${profile.id}:${profile.linkedAccount?.id ?? ''}`}
              profile={profile}
              candidates={candidates}
              pending={pending}
              onChange={(accountId) => onChange(profile.id, accountId)}
            />
          ))}
        </ul>
      )}
    </>
  );
}
