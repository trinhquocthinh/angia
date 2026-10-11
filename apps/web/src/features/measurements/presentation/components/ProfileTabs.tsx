import { Link } from '@tanstack/react-router';

const LINKED_TABS = [
  { key: 'health', label: 'Diễn biến sức khỏe', to: '/profiles/$profileId' },
  { key: 'medications', label: 'Thuốc điều trị', to: '/profiles/$profileId/medications' },
] as const;
const LATER_TABS = ['Kết quả xét nghiệm', 'Hồ sơ & Giấy tờ khám'];
const tabClass =
  'min-h-11 shrink-0 content-center border-b-2 border-transparent px-4 text-sm font-medium text-[#55615f] disabled:opacity-55 aria-[current=page]:border-[#004135] aria-[current=page]:text-[#004135]';

export type ProfileTabKey = (typeof LINKED_TABS)[number]['key'];

// Tab hồ sơ: Diễn biến sức khỏe và Thuốc điều trị (E4-S4-T1) là route; các tab khác mở ở Epic sau.
export function ProfileTabs({ profileId, active }: { profileId: string; active: ProfileTabKey }) {
  return (
    <nav aria-label="Các mục hồ sơ" className="flex gap-1 overflow-x-auto border-b border-[#e4f0ef]">
      {LINKED_TABS.map((tab) => (
        <Link
          key={tab.key}
          to={tab.to}
          params={{ profileId }}
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
