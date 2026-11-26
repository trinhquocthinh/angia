import { lazy, Suspense, useState } from 'react';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { AdherencePeriod } from '../application/ports';
import { createAdherenceRepository } from '../infrastructure/createAdherenceRepository';

const AdherenceSheet = lazy(() =>
  import('./AdherenceSheet').then((module) => ({ default: module.AdherenceSheet })),
);

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
        className="inline-flex min-h-btn items-center rounded-2xl border border-border/45 bg-surface px-4 text-button-secondary font-semibold text-accent shadow-stitch-sm transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        Ghi thực tế dùng thuốc
      </button>
      {open && (
        <Suspense fallback={null}>
          <AdherenceSheet
            key={`${session.account.id}:${session.family.id}:${profile.id}`}
            profile={profile}
            session={session}
            repository={repository}
            onClose={() => setOpen(false)}
            onSaved={onSaved}
          />
        </Suspense>
      )}
    </>
  );
}
