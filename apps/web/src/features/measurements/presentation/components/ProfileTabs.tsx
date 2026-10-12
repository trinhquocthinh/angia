import { Link } from '@tanstack/react-router';

const LINKED_TABS = [
  { key: 'health', label: 'Diễn biến sức khỏe', to: '/profiles/$profileId' },
  { key: 'medications', label: 'Thuốc điều trị', to: '/profiles/$profileId/medications' },
] as const;
const LATER_TABS = ['Kết quả xét nghiệm', 'Hồ sơ & Giấy tờ khám'];
// Tab Stitch 718c9615: chữ đậm màu secondary + gạch chân bo tròn cho tab đang mở.
const tabClass =
  "relative min-h-11 shrink-0 content-center px-4 text-sm font-medium whitespace-nowrap text-[#404945] transition-colors hover:text-[#131d1d] disabled:opacity-55 disabled:hover:text-[#404945] aria-[current=page]:font-bold aria-[current=page]:text-[#286958] aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-0 aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:rounded-full aria-[current=page]:after:bg-[#286958] aria-[current=page]:after:content-['']";

export type ProfileTabKey = (typeof LINKED_TABS)[number]['key'];

// Tab hồ sơ: Diễn biến sức khỏe và Thuốc điều trị (E4-S4-T1) là route; các tab khác mở ở Epic sau.
export function ProfileTabs({ profileId, active }: { profileId: string; active: ProfileTabKey }) {
  return (
    <nav aria-label="Các mục hồ sơ" className="flex gap-2 overflow-x-auto pb-1">
      {LINKED_TABS.map((tab) => (
        <Link
          key={tab.key}
          to={tab.to}
          params={{ profileId }}
          // Link tự gắn aria-current khi URL khớp tiền tố: tab "Diễn biến" sẽ sáng cả ở /medications.
          activeOptions={{ exact: true }}
          aria-current={tab.key === active ? 'page' : undefined}
          className={tabClass}
        >
          {tab.label}
        </Link>
      ))}
      {LATER_TABS.map((tab) => (
        <button key={tab} type="button" disabled title="Sẽ có ở bản cập nhật sau" className={tabClass}>
          {tab}
        </button>
      ))}
    </nav>
  );
}
