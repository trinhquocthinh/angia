type Props = { name: 'home' | 'profile' | 'settings' | 'account-settings' | 'logout' };

export function AccountMenuIcon({ name }: Props) {
  const filename = name === 'profile' ? 'profile-card' : name;
  return (
    <img
      className="account-menu-clay-icon"
      src={`/images/account-menu/${filename}-3d.png`}
      width="40"
      height="40"
      alt=""
    />
  );
}
