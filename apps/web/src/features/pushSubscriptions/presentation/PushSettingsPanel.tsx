import { createPushApi } from '../infrastructure/createPushApi';
import { getPushSupport } from '../infrastructure/getPushSupport';
import { getNotificationPermission } from '../infrastructure/getNotificationPermission';
import { enableBrowserPush } from '../infrastructure/enableBrowserPush';
import { disableBrowserPush } from '../infrastructure/disableBrowserPush';
import { usePushSettings } from '../application/usePushSettings';
import { describePushState } from '../application/describePushState';
import { PushActionButtons } from './PushActionButtons';
import { PushHero } from './PushHero';
import { PushStatusCard } from './PushStatusCard';
import { PushDeviceCard } from './PushDeviceCard';
import { LockScreenPreview } from './LockScreenPreview';
import { PushDeviceDetails } from './PushDeviceDetails';
import { PushFeedback } from './PushFeedback';
import { PushNotes } from './PushNotes';
const api = createPushApi();
export function PushSettingsPanel({ csrf }: { csrf: string }) {
  const { config, action } = usePushSettings(api, csrf);
  const support = getPushSupport();
  const run = (work: () => Promise<void>, success: string) => {
    // Xin quyền ngay trong event bấm, trước các bước async của mutation trên iOS.
    const task = work();
    action.mutate({ task, success });
  };
  const data = config.data;
  const state = describePushState({ data, error: config.isError, support });
  const enabled = Boolean(data?.enabled && data.publicKey);
  const registered = Boolean(data?.registered);
  const enable = () =>
    run(() => enableBrowserPush(api, data!.publicKey!, csrf), 'Đã bật thông báo trên thiết bị này.');
  const disable = () => run(() => disableBrowserPush(api, csrf), 'Đã tắt thông báo trên thiết bị này.');
  return (
    <div className="mx-auto grid max-w-2xl gap-4 lg:max-w-6xl text-[#131d1d] lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
      <section className="flex min-w-0 flex-col gap-4 lg:gap-6">
        <PushHero />
        <PushDeviceCard
          state={state}
          registered={registered}
          canToggle={!action.isPending && !support && Boolean(data) && (registered || enabled)}
          onToggle={registered ? disable : enable}
        />
        <div className="hidden lg:block">
          <PushStatusCard
            state={state}
            refreshing={config.isFetching}
            onRefresh={() => void config.refetch()}
          />
        </div>
        <div className="lg:hidden">
          <LockScreenPreview />
        </div>
        <PushFeedback config={config} action={action} />
        <PushActionButtons
          busy={action.isPending}
          supported={!support}
          loaded={Boolean(data)}
          enabled={enabled}
          registered={registered}
          onEnable={enable}
          onTest={() =>
            run(
              () => api.sendTest(csrf),
              'Dịch vụ push đã tiếp nhận tin thử. Kiểm tra thông báo trên thiết bị.',
            )
          }
          onDisable={disable}
        />
        <PushNotes />
      </section>
      <aside className="hidden flex-col gap-6 lg:flex">
        <LockScreenPreview />
        <PushDeviceDetails supported={!support} permission={getNotificationPermission()} data={data} />
      </aside>
    </div>
  );
}
