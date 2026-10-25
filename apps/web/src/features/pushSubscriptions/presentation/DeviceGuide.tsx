import { useSyncExternalStore } from 'react';
import type { DeviceGuideKind } from '../application/chooseDeviceGuide';
import type { InstallPrompt } from '../infrastructure/installPrompt';
import { AndroidInstallGuide } from './AndroidInstallGuide';
import { IosInstallGuide } from './IosInstallGuide';
import { OpenInBrowserGuide } from './OpenInBrowserGuide';
import { UnblockNotificationsGuide } from './UnblockNotificationsGuide';

const noPrompt = () => false;

interface Props {
  guide: DeviceGuideKind;
  installPrompt: InstallPrompt;
}

export function DeviceGuide({ guide, installPrompt }: Props) {
  const canPrompt = useSyncExternalStore(installPrompt.subscribe, installPrompt.available, noPrompt);
  switch (guide) {
    case 'open-in-browser':
      return <OpenInBrowserGuide />;
    case 'ios-install':
      return <IosInstallGuide />;
    case 'unblock-ios':
      return <UnblockNotificationsGuide os="ios" />;
    case 'unblock-android':
      return <UnblockNotificationsGuide os="android" />;
    case 'android-install':
      return (
        <AndroidInstallGuide canPrompt={canPrompt} onInstall={() => void installPrompt.promptInstall()} />
      );
    case 'none':
      return null;
  }
}
