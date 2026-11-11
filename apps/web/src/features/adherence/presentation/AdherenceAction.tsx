import { useState } from 'react';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { AdherencePeriod } from '../application/ports';
import { createAdherenceRepository } from '../infrastructure/createAdherenceRepository';
import { AdherenceSheet } from './AdherenceSheet';

const repository = createAdherenceRepository();

type Props = { profile: HealthProfile; session: ProfileSession; onSaved: (period: AdherencePeriod) => void };

// Nút "Ghi thực tế dùng thuốc" (đổi tên 2026-10-16 để không nhầm với dừng đợt thuốc) trên thanh công cụ tab Diễn biến (Stitch 718c9615); chỉ main.
export function AdherenceAction({ profile, session, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  if (session.role !== 'main' || !session.family) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-11 rounded-xl bg-accent-soft px-4 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        Ghi thực tế dùng thuốc
      </button>
      {open && (
        <AdherenceSheet
          key={`${session.account.id}:${session.family.id}:${profile.id}`}
          profile={profile}
          session={session}
          repository={repository}
          onClose={() => setOpen(false)}
          onSaved={onSaved}
        />
      )}
    </>
  );
}
