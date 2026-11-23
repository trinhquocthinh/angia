import {
  AccountSettings3DIcon,
  type Account3DIconName,
} from '@src/features/account/presentation/settings/AccountSettings3DIcon';

type Props = {
  id: string;
  title: string;
  icon: Account3DIconName;
  danger?: boolean;
};

export function AccountPlaceholderCard({ id, title, icon, danger = false }: Props) {
  return (
    <section
      className={danger ? 'account-card account-placeholder-danger' : 'account-card account-placeholder'}
      aria-labelledby={id}
    >
      <div className="account-card-title-group">
        <AccountSettings3DIcon name={icon} />
        <div>
          <h2 id={id} className="account-card-title">
            {title}
          </h2>
          <p className="account-placeholder-copy">Sẽ có ở bản sau</p>
        </div>
      </div>
    </section>
  );
}
