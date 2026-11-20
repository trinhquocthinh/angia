import './clay-icon.css';

type Name =
  | 'avatar'
  | 'create-house'
  | 'name-house'
  | 'owner'
  | 'privacy'
  | 'family'
  | 'member'
  | 'manager'
  | 'send'
  | 'copy'
  | 'link'
  | 'revoke'
  | 'key'
  | 'keep'
  | 'revoke-button';

export function ClayIcon({ name, size = 24 }: { name: Name; size?: number }) {
  return (
    <span className={`clay-icon clay-icon-${name}`} style={{ width: size, height: size }} aria-hidden="true">
      <img src={`/images/household/stitch/${name}.svg`} width={size} height={size} alt="" />
    </span>
  );
}
