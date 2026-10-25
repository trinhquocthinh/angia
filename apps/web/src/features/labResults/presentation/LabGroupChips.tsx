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
              className="inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-medium whitespace-nowrap text-[#004135] shadow-sm hover:bg-[#e4f0f0] focus-visible:outline-2 focus-visible:outline-[#286958]"
            >
              {group.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
