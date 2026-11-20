type Name =
  | `member-avatar-${'owner' | 'main' | 'member'}`
  | `role-${'owner' | 'main' | 'member'}`
  | `role-option-${'main' | 'member'}`
  | 'member-protected'
  | 'member-lock'
  | 'family-home'
  | 'invite-add'
  | 'home-close'
  | 'home-logout-danger'
  | 'home-send'
  | 'home-delete-shield'
  | 'family'
  | 'member-chevron';

export function MemberClayGlyph({ name, size }: { name: Name; size: number }) {
  return (
    <img src={`/images/household/stitch/${name}.svg`} width={size} height={size} alt="" aria-hidden="true" />
  );
}
