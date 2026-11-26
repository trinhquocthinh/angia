import { useState } from 'react';
import type { Account, AdminProfileLink } from '../../application/ports';
import { ProfileLinkConfirm } from './ProfileLinkConfirm';
import { ProfileLinkSelect } from './ProfileLinkSelect';

const NONE = '';
// Hai bước vì chuyển nhầm sẽ mở dữ liệu sức khỏe của hồ sơ cho tài khoản khác.
export function ProfileLinkRow({
  profile,
  candidates,
  pending,
  onChange,
}: {
  profile: AdminProfileLink;
  candidates: Account[];
  pending: boolean;
  onChange: (accountId: string | null) => void;
}) {
  const current = profile.linkedAccount?.id ?? NONE;
  const [selected, setSelected] = useState(current);
  const [confirming, setConfirming] = useState(false);
  const target = candidates.find((account) => account.id === selected)?.displayName;
  return (
    <li className="flex flex-col gap-2.5 rounded-2xl border border-border/35 bg-bg p-4">
      <p className="m-0 text-body font-semibold text-text-primary [overflow-wrap:anywhere]">
        {profile.displayName}
      </p>
      <ProfileLinkSelect
        linkedAccount={profile.linkedAccount}
        candidates={candidates}
        value={selected}
        pending={pending}
        onChange={(value) => {
          setSelected(value);
          setConfirming(false);
        }}
      />
      {selected !== current && !confirming && (
        <button
          type="button"
          disabled={pending}
          className="min-h-btn cursor-pointer rounded-2xl bg-accent px-4 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors enabled:hover:bg-accent-hover disabled:opacity-65"
          onClick={() => setConfirming(true)}
        >
          {selected === NONE ? 'Gỡ liên kết' : 'Chuyển liên kết'}
        </button>
      )}
      {selected !== current && confirming && (
        <ProfileLinkConfirm
          question={
            selected === NONE
              ? `Gỡ liên kết của hồ sơ ${profile.displayName}?`
              : `Chuyển hồ sơ ${profile.displayName} sang tài khoản ${target}?`
          }
          pending={pending}
          onConfirm={() => onChange(selected === NONE ? null : selected)}
          onCancel={() => {
            setSelected(current);
            setConfirming(false);
          }}
        />
      )}
    </li>
  );
}
