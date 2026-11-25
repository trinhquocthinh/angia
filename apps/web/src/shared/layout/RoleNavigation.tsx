import { Link, useLocation } from '@tanstack/react-router';
import { navigationItems } from './navigationItems';
import { activeNavigation } from './activeNavigation';
import './role-navigation.css';

type Props = { personal?: boolean; pendingCount?: number | undefined; variant: 'topbar' | 'responsive' };

export function RoleNavigation({ personal = false, pendingCount, variant }: Props) {
  const location = useLocation();
  const active = activeNavigation(location.pathname, location.search?.view);
  return (
    <nav
      aria-label="Điều hướng chính"
      className={`role-navigation role-navigation-${variant}${variant === 'responsive' ? ' mobile-bottom-nav' : ''}`}
    >
      {navigationItems(personal).map((item) => (
        <Link
          key={item.id}
          to={item.to}
          search={item.to === '/' ? { view: item.id === 'profiles' ? 'profiles' : undefined } : {}}
          activeOptions={{ exact: true, includeSearch: true, explicitUndefined: true }}
          aria-current={active === item.id ? 'page' : undefined}
          data-active={active === item.id}
          className="role-navigation-item"
        >
          <img className="role-navigation-icon" src={item.icon} alt="" width="28" height="28" />
          <span>{item.label}</span>
          {item.id === 'documents' && pendingCount !== undefined && pendingCount > 0 && (
            <span className="role-navigation-badge">
              <span aria-hidden="true">{pendingCount}</span>
              <span className="sr-only">, {pendingCount} giấy tờ chờ duyệt</span>
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
