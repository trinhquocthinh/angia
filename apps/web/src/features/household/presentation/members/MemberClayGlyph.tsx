type Name =
  | `member-avatar-${'owner' | 'main' | 'member'}`
  | `role-${'owner' | 'main' | 'member'}`
  | `role-option-${'main' | 'member'}`
  | 'member-protected'
  | 'member-lock'
  | 'family-home'
  | 'invite-add';

export function MemberClayGlyph({ name, size }: { name: Name; size: number }) {
  return (
    <img src={`/images/household/stitch/${name}.svg`} width={size} height={size} alt="" aria-hidden="true" />
  );
}
