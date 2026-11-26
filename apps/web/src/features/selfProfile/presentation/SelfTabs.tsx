import { Link } from '@tanstack/react-router';
import { useScrollActiveTab } from '@src/features/measurements/presentation/components/useScrollActiveTab';
import {
  ProfileSectionIcon,
  type ProfileSectionIconName,
} from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { selfSections, type SelfSectionKey } from '../application/selfSections';

const SELF_ICONS: Record<SelfSectionKey, ProfileSectionIconName> = {
  today: 'medication',
  revisits: 'event',
  timeline: 'history',
  health: 'monitor_heart',
  'lab-results': 'science',
  temperatures: 'thermostat',
  pain: 'accessibility_new',
};

export function SelfTabs({ active, showsVitals }: { active: SelfSectionKey; showsVitals: boolean }) {
  const navRef = useScrollActiveTab(active);
  return (
    <nav ref={navRef} aria-label="Các mục hồ sơ của tôi" className="profile-self-rail">
      {selfSections(showsVitals).map((item) => (
        <Link
          key={item.key}
          to="/my-profile"
          search={item.key === 'today' ? {} : { section: item.key }}
          activeOptions={{ exact: true, includeSearch: true }}
          aria-current={item.key === active ? 'page' : undefined}
          className="profile-bento-tile"
        >
          {item.key === active && <span className="profile-bento-tile-dot" aria-hidden="true" />}
          <ProfileSectionIcon name={SELF_ICONS[item.key]} size={40} />
          <span className="profile-bento-tile-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
