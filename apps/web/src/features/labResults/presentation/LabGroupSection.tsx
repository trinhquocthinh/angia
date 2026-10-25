import type { LabGroup } from '../application/groupLabSeries';
import { LabSeriesCard } from './LabSeriesCard';

// Một nhóm cơ quan trên tab "Kết quả xét nghiệm" (Design LG-01): tiêu đề nhóm + lưới thẻ chỉ số.
export function LabGroupSection({ group }: { group: LabGroup }) {
  const headingId = `lab-group-${group.id}-heading`;
  return (
    <section
      id={`lab-group-${group.id}`}
      aria-labelledby={headingId}
      className="flex scroll-mt-24 flex-col gap-3"
    >
      <div className="flex items-baseline gap-2">
        <h2 id={headingId} className="text-xl font-semibold text-[#004135]">
          {group.label}
        </h2>
        <span className="text-xs font-medium text-[#707975]">{group.items.length} chỉ số</span>
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
