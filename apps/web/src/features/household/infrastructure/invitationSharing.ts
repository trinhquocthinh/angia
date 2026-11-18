import type { InvitationSharing } from '../application/invitationPorts';

export function createInvitationSharing(): InvitationSharing {
  return {
    async copy(text) {
      try {
        if (!navigator.clipboard?.writeText) return false;
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    },
    ...(typeof navigator !== 'undefined' && navigator.share
      ? {
          async share(invitation: { code: string; link: string }) {
            try {
              await navigator.share({
                title: 'Lời mời AN GIA',
                text: `Mời bạn tham gia nhà trên AN GIA. Mã mời: ${invitation.code}.`,
                url: invitation.link,
              });
              return 'shared' as const;
            } catch (error) {
              return error instanceof DOMException && error.name === 'AbortError'
                ? ('cancelled' as const)
                : ('failed' as const);
            }
          },
        }
      : {}),
  };
}
