import type { ReactNode } from 'react';
import {
  ProfileSectionIcon,
  type ProfileSectionIconName,
} from '@src/features/profiles/presentation/components/ProfileSectionIcon';

export function PickerCard({
  icon,
  title,
  hint,
  required = false,
  children,
}: {
  icon: ProfileSectionIconName;
  title: string;
  hint: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset className="doc-bento-card flex min-w-0 flex-col gap-3.5 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <legend className="contents">
          <span className="flex items-center gap-2.5 text-body font-semibold text-accent">
            <span className="doc-clay-tile-sm" aria-hidden="true">
              <ProfileSectionIcon name={icon} size={26} />
            </span>
            <span className="auth-heading text-heading-2 font-semibold text-accent">{title}</span>
          </span>
        </legend>
        <span
          className={`rounded-full px-2.5 py-0.5 text-caption font-semibold ${
            required ? 'bg-danger-soft/75 text-danger' : 'bg-surface-container text-text-secondary'
          }`}
        >
          {hint}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}
