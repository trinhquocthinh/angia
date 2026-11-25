import type { ReactNode } from 'react';
import { AdminIcon, type AdminIconName } from '@src/features/family/presentation/components/AdminIcon';
import { currentVietnamYear } from '../../application/currentVietnamYear';
import type { HealthProfile } from '../../application/ports';

const CONSENT_PILL: Record<
  HealthProfile['consentStatus'],
  { label: string; icon: AdminIconName; tone: 'confirmed' | 'warning' | 'danger' }
> = {
  confirmed: { label: 'Đã đồng thuận', icon: 'check_circle', tone: 'confirmed' },
  pending: { label: 'Chờ đồng thuận', icon: 'pending_actions', tone: 'warning' },
  invited: { label: 'Chờ đồng thuận', icon: 'pending_actions', tone: 'warning' },
  declined: { label: 'Đã từ chối', icon: 'info', tone: 'danger' },
  withdrawn: { label: 'Đã rút đồng thuận', icon: 'info', tone: 'danger' },
};

type Props = {
  title: string;
  displayName: string;
  birthYear: number | null;
  consentStatus: HealthProfile['consentStatus'];
  subtitle?: string | undefined;
  actions?: ReactNode;
  footer?: ReactNode;
};

// Thẻ định danh hồ sơ dùng chung giữa /profiles/:id và /my-profile theo chuẩn 3D Bento v2.0.
export function ProfileIdentityHero({
  title,
  displayName,
  birthYear,
  consentStatus,
  subtitle,
  actions,
  footer,
}: Props) {
  const age = birthYear === null ? null : currentVietnamYear() - birthYear;
  const pill = CONSENT_PILL[consentStatus];
  const ageMeta = age === null ? 'Chưa có năm sinh' : `${age} tuổi · ${birthYear}`;
  return (
    <header className="profile-bento-card flex flex-col gap-4 p-5 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <span className="profile-ceramic-avatar profile-ceramic-avatar-lg" aria-hidden="true">
            {displayName.slice(0, 1)}
            {consentStatus === 'confirmed' && (
              <span className="profile-ceramic-badge">
                <AdminIcon name="verified_user" size={15} />
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="auth-heading break-words text-heading-1 font-semibold tracking-tight text-text-primary">
                {title}
              </h1>
              <span className={`profile-consent-pill profile-consent-pill-${pill.tone}`}>
                <AdminIcon name={pill.icon} size={15} />
                {pill.label}
              </span>
            </div>
            <p className="break-words text-caption text-text-secondary">
              {subtitle ? `${subtitle} · ${ageMeta}` : ageMeta}
            </p>
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0">{actions}</div>}
      </div>
      {footer}
    </header>
  );
}
