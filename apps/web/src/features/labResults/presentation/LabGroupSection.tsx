import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import type { LabGroup } from '../application/groupLabSeries';
import { LabSeriesCard } from './LabSeriesCard';

// Một nhóm cơ quan trên tab "Kết quả xét nghiệm" (Design LG-01): tiêu đề + icon 3D + lưới thẻ Bento.
export function LabGroupSection({ group }: { group: LabGroup }) {
  const headingId = `lab-group-${group.id}-heading`;
  return (
    <section
      id={`lab-group-${group.id}`}
      aria-labelledby={headingId}
      className="flex scroll-mt-24 flex-col gap-3.5"
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2.5">
          <ProfileSectionIcon name="science" size={28} />
          <h2 id={headingId} className="auth-heading text-heading-2 font-semibold text-accent">
            {group.label}
          </h2>
        </div>
        <span className="rounded-full bg-surface-container px-3 py-0.5 text-caption font-semibold text-text-secondary tabular-nums">
          {group.items.length} chỉ số
        </span>
      </div>
      <div className="grid items-start gap-4 md:grid-cols-2">
        {group.items.map(({ series, note }, index) => (
          <LabSeriesCard
            key={series.results[0]!.id}
            series={series}
            note={note}
            headingId={`lab-series-${group.id}-${index}`}
          />
        ))}
      </div>
    </section>
  );
}
