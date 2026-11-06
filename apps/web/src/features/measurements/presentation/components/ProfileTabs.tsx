import { Link } from '@tanstack/react-router';
import { profileTabClass } from './profileTabClass';
import { useScrollActiveTab } from './useScrollActiveTab';

const LINKED_TABS = [
  { key: 'health', label: 'Diễn biến sức khỏe', to: '/profiles/$profileId' },
  { key: 'timeline', label: 'Dòng thời gian', to: '/profiles/$profileId/timeline' },
  { key: 'pain', label: 'Đau nhức', to: '/profiles/$profileId/pain' },
  { key: 'medications', label: 'Thuốc điều trị', to: '/profiles/$profileId/medications' },
  { key: 'lab-results', label: 'Kết quả xét nghiệm', to: '/profiles/$profileId/lab-results' },
  { key: 'revisits', label: 'Lịch tái khám', to: '/profiles/$profileId/revisits' },
  { key: 'documents', label: 'Hồ sơ & Giấy tờ khám', to: '/profiles/$profileId/documents' },
] as const;

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
  const navRef = useScrollActiveTab(active);
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
          className={profileTabClass}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
