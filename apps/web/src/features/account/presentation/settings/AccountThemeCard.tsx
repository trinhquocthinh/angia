import { ThemeSwitch } from '@src/shared/theme/ThemeSwitch';
import { AccountSettings3DIcon } from '@src/features/account/presentation/settings/AccountSettings3DIcon';
import {
  AccountSettingsIcon,
  type AccountMaskIconName,
} from '@src/features/account/presentation/settings/AccountSettingsIcon';

const themeIcons: Record<'light' | 'dark' | 'system', AccountMaskIconName> = {
  light: 'light_mode',
  dark: 'dark_mode',
  system: 'settings_brightness',
};

export function AccountThemeCard() {
  return (
    <section className="account-card account-tile-card" aria-labelledby="account-theme-heading">
      <div className="account-card-title-group">
        <AccountSettings3DIcon name="palette-3d" />
        <h2 id="account-theme-heading" className="account-card-title">
          Nền giao diện
        </h2>
      </div>
      <ThemeSwitch
        appearance="account"
        renderIcon={(value) => <AccountSettingsIcon name={themeIcons[value]} className="account-icon-sm" />}
      />
    </section>
  );
}
