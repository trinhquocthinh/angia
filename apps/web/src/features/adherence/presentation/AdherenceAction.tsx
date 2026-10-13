import { useState } from 'react';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { AdherencePeriod } from '../application/ports';
import { createAdherenceRepository } from '../infrastructure/createAdherenceRepository';
import { AdherenceSheet } from './AdherenceSheet';

const repository = createAdherenceRepository();

type Props = { profile: HealthProfile; session: ProfileSession; onSaved: (period: AdherencePeriod) => void };

// Nút "Ghi giai đoạn dùng thuốc" trên thanh công cụ tab Diễn biến (Stitch 718c9615); chỉ main.
export function AdherenceAction({ profile, session, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  if (session.role !== 'main' || !session.family) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-11 rounded-xl bg-[#e3efea] px-4 text-sm font-semibold text-[#004135] transition-colors hover:bg-[#d3e7df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
      >
        Ghi giai đoạn dùng thuốc
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
