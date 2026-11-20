import type { RefObject } from 'react';

export type MemberDetailLayoutProps = {
  isDesktop?: boolean | undefined;
  returnFocusRef?: RefObject<HTMLButtonElement | null> | undefined;
};
