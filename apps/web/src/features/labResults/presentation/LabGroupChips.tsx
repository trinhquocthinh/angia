import type { LabGroup } from '../application/groupLabSeries';

// Hàng chip nhảy tới từng nhóm; cuộn ngang trên màn hẹp (Design LG-01).
export function LabGroupChips({ groups }: { groups: LabGroup[] }) {
  return (
    <nav aria-label="Nhóm chỉ số" className="-mx-1 overflow-x-auto px-1">
      <ul className="flex w-max gap-2">
        {groups.map((group) => (
          <li key={group.id}>
            <a
              href={`#lab-group-${group.id}`}
              className="inline-flex min-h-11 items-center rounded-full bg-surface px-4 text-sm font-medium whitespace-nowrap text-accent shadow-sm hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-focus"
            >
              {group.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
