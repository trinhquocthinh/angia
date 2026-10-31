import { useEffect, useRef } from 'react';
import { Link } from '@tanstack/react-router';

const LINKED_TABS = [
  { key: 'health', label: 'Diễn biến sức khỏe', to: '/profiles/$profileId' },
  { key: 'timeline', label: 'Dòng thời gian', to: '/profiles/$profileId/timeline' },
  { key: 'medications', label: 'Thuốc điều trị', to: '/profiles/$profileId/medications' },
  { key: 'lab-results', label: 'Kết quả xét nghiệm', to: '/profiles/$profileId/lab-results' },
  { key: 'revisits', label: 'Lịch tái khám', to: '/profiles/$profileId/revisits' },
  { key: 'documents', label: 'Hồ sơ & Giấy tờ khám', to: '/profiles/$profileId/documents' },
] as const;
// Tab Stitch 718c9615: chữ đậm màu secondary + gạch chân bo tròn cho tab đang mở.
const tabClass =
  "relative min-h-11 shrink-0 content-center px-4 text-sm font-medium whitespace-nowrap text-[#404945] transition-colors hover:text-[#131d1d] aria-[current=page]:font-bold aria-[current=page]:text-[#286958] aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-0 aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:rounded-full aria-[current=page]:after:bg-[#286958] aria-[current=page]:after:content-['']";

export type ProfileTabKey = (typeof LINKED_TABS)[number]['key'];

// Tab hồ sơ đều là route: Diễn biến sức khỏe, Thuốc điều trị (E4-S4-T1), Kết quả xét nghiệm (E5-S2-T1),
// Hồ sơ & Giấy tờ khám (E5-S4-T1).
export function ProfileTabs({
  profileId,
  active,
  showsVitals = true,
}: {
  profileId: string;
  active: ProfileTabKey;
  showsVitals?: boolean;
}) {
  const navRef = useRef<HTMLElement>(null);
  // Màn hẹp: dải tab cuộn ngang, kéo tab đang mở vào tầm nhìn (chỉ cuộn ngang, không cuộn trang).
  useEffect(() => {
    const nav = navRef.current;
    const current = nav?.querySelector('[aria-current="page"]');
    if (!nav || !current) return;
    const overflow = current.getBoundingClientRect().right - nav.getBoundingClientRect().right;
    if (overflow > 0) nav.scrollLeft += overflow;
  }, [active]);
  return (
    <nav ref={navRef} aria-label="Các mục hồ sơ" className="flex gap-2 overflow-x-auto pb-1">
      {LINKED_TABS.filter((tab) => tab.key !== 'health' || showsVitals).map((tab) => (
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
    </nav>
  );
}
