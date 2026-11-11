import { Link } from '@tanstack/react-router';
import { profileTabClass } from '@src/features/measurements/presentation/components/profileTabClass';
import { TabUnderline } from '@src/features/measurements/presentation/components/TabUnderline';
import { useScrollActiveTab } from '@src/features/measurements/presentation/components/useScrollActiveTab';
import { selfSections, type SelfSectionKey } from '../application/selfSections';

export function SelfTabs({ active, showsVitals }: { active: SelfSectionKey; showsVitals: boolean }) {
  const navRef = useScrollActiveTab(active);
  return (
    <nav ref={navRef} aria-label="Các mục hồ sơ của tôi" className="flex gap-2 overflow-x-auto pb-1">
      {selfSections(showsVitals).map((item) => (
        <Link
          key={item.key}
          to="/my-profile"
          search={item.key === 'today' ? {} : { section: item.key }}
          activeOptions={{ exact: true, includeSearch: true }}
          aria-current={item.key === active ? 'page' : undefined}
          className={profileTabClass}
        >
          {item.label}
          <TabUnderline active={item.key === active} />
        </Link>
      ))}
    </nav>
  );
}
