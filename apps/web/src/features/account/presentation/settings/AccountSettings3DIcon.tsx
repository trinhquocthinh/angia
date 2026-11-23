export type Account3DIconName = 'mail-3d' | 'lock-3d' | 'palette-3d' | 'download-3d' | 'shield-danger-3d';

export function AccountSettings3DIcon({ name }: { name: Account3DIconName }) {
  return (
    <span className={`account-3d-tile account-3d-${name}`} aria-hidden="true">
      <span className="account-3d-inner">
        <img
          src={`/images/household/stitch/account-${name}.svg`}
          alt=""
          className="account-3d-img"
          width={28}
          height={28}
        />
      </span>
    </span>
  );
}
