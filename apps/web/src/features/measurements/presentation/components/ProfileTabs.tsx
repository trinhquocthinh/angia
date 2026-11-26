import { Link } from '@tanstack/react-router';
import {
  ProfileSectionIcon,
  type ProfileSectionIconName,
} from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { TabUnderline } from './TabUnderline';
import { useScrollActiveTab } from './useScrollActiveTab';

type TabDef = {
  key:
    | 'overview'
    | 'health'
    | 'timeline'
    | 'pain'
    | 'medications'
    | 'lab-results'
    | 'revisits'
    | 'documents'
    | 'guardians';
  label: string;
  to:
    | '/profiles/$profileId'
    | '/profiles/$profileId/timeline'
    | '/profiles/$profileId/pain'
    | '/profiles/$profileId/medications'
    | '/profiles/$profileId/lab-results'
    | '/profiles/$profileId/revisits'
    | '/profiles/$profileId/documents'
    | '/profiles/$profileId/guardians';
  icon?: ProfileSectionIconName;
};

const LINKED_TABS: readonly TabDef[] = [
  { key: 'overview', label: 'Mục lục', to: '/profiles/$profileId' },
  { key: 'health', label: 'Diễn biến sức khỏe', to: '/profiles/$profileId', icon: 'monitor_heart' },
  { key: 'timeline', label: 'Dòng thời gian', to: '/profiles/$profileId/timeline', icon: 'history' },
  { key: 'pain', label: 'Đau nhức', to: '/profiles/$profileId/pain', icon: 'accessibility_new' },
  { key: 'medications', label: 'Thuốc điều trị', to: '/profiles/$profileId/medications', icon: 'medication' },
  {
    key: 'lab-results',
    label: 'Kết quả xét nghiệm',
    to: '/profiles/$profileId/lab-results',
    icon: 'science',
  },
  { key: 'revisits', label: 'Lịch tái khám', to: '/profiles/$profileId/revisits', icon: 'event' },
  {
    key: 'documents',
    label: 'Hồ sơ & Giấy tờ khám',
    to: '/profiles/$profileId/documents',
    icon: 'folder_open',
  },
  {
    key: 'guardians',
    label: 'Người giám hộ',
    to: '/profiles/$profileId/guardians',
    icon: 'supervisor_account',
  },
];

export type ProfileTabKey = TabDef['key'];

export function ProfileTabs({
  profileId,
  active,
  showsVitals = true,
  showsGuardians = false,
}: {
  profileId: string;
  active: ProfileTabKey;
  showsVitals?: boolean;
  showsGuardians?: boolean;
}) {
  const navRef = useScrollActiveTab(active);
  return (
    <nav ref={navRef} aria-label="Các mục hồ sơ" className="profile-tabs-pillbar">
      {LINKED_TABS.filter(
        (tab) => (tab.key !== 'health' || showsVitals) && (tab.key !== 'guardians' || showsGuardians),
      ).map((tab) => (
        <Link
          key={tab.key}
          to={tab.to}
          params={{ profileId }}
          search={tab.key === 'health' ? { section: 'health' } : {}}
          activeOptions={{ exact: true, includeSearch: true }}
          aria-current={tab.key === active ? 'page' : undefined}
          className="profile-tab-pill"
        >
          {tab.label}
          <TabUnderline active={tab.key === active} />
          <span className="order-first inline-flex shrink-0" aria-hidden="true">
            {tab.icon ? (
              <ProfileSectionIcon name={tab.icon} size={22} />
            ) : (
              <img
                src="/images/account-menu/profile-card-3d.png"
                alt=""
                width="22"
                height="22"
                className="profile-clay-icon h-[22px] w-[22px]"
              />
            )}
          </span>
        </Link>
      ))}
    </nav>
  );
}
