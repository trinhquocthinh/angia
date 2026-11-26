import type { LabGroup } from '../application/groupLabSeries';

// Hàng chip nhảy tới từng nhóm chuẩn 3D Bento v2.0 (Design LG-01).
export function LabGroupChips({ groups }: { groups: LabGroup[] }) {
  return (
    <nav aria-label="Nhóm chỉ số" className="overflow-x-auto pb-1">
      <ul className="inline-flex gap-1.5 rounded-[18px] bg-surface-container-high p-1.5">
        {groups.map((group) => (
          <li key={group.id}>
            <a
              href={`#lab-group-${group.id}`}
              className="inline-flex min-h-btn items-center rounded-[14px] bg-surface px-4 text-button-secondary font-semibold whitespace-nowrap text-accent shadow-2xs transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-focus"
            >
              {group.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
