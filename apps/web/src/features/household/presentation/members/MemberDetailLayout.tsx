import { useRef, type ReactNode } from 'react';
import type { MemberDetailLayoutProps } from './memberDetailLayoutProps';
import { MemberDetailSheet } from './MemberDetailSheet';

type Props = MemberDetailLayoutProps & { onClose: () => void; children: ReactNode };

export function MemberDetailLayout({ isDesktop = true, returnFocusRef, onClose, children }: Props) {
  const fallbackRef = useRef<HTMLButtonElement | null>(null);
  if (isDesktop) return <div className="household-members-detail-rail">{children}</div>;
  return (
    <MemberDetailSheet returnFocusRef={returnFocusRef ?? fallbackRef} onClose={onClose}>
      {children}
    </MemberDetailSheet>
  );
}
