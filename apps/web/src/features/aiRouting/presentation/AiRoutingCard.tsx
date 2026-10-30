import { AiRoutingCardActions } from './AiRoutingCardActions';
import type { useAiRouting } from '../application/useAiRouting';
import { useAiRoutingPanel } from '../application/useAiRoutingPanel';
import { AdminRequestError } from '@src/features/family/application/AdminRequestError';
import { AdminCardHeading } from '@src/features/family/presentation/components/AdminCardHeading';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { AiRoutingSummary } from './AiRoutingSummary';
import { AiRoutingForm } from './AiRoutingForm';
import { AiRoutingRuntimeNotice } from './AiRoutingRuntimeNotice';

export function AiRoutingCard({
  state,
  updatedByName,
}: {
  state: ReturnType<typeof useAiRouting>;
  updatedByName: string | null;
}) {
  const panel = useAiRoutingPanel(state);
  const { config, save } = state;
  const busy = config.isFetching || save.isPending;
  return (
    <article
      aria-labelledby="ai-routing-title"
      aria-busy={busy}
      className="admin-panel min-w-0 max-[1199px]:self-start rounded-2xl bg-white p-4 sm:p-5 shadow-sm flex flex-col gap-4 admin-reveal"
    >
      <AdminCardHeading
        id="ai-routing-title"
        icon={<AdminIcon name="settings" />}
        title="Nhận diện chứng từ"
        aside={
          config.data && (
            <span className="shrink-0 rounded-full bg-[#e4f0f0] px-2.5 py-1 text-xs font-medium text-[#404945]">
              Bản {config.data.version}
            </span>
          )
        }
      />
      {config.isError && (
        <p role="alert" className="m-0 text-[12px] leading-5 text-[#93000a]">
          {config.error instanceof AdminRequestError
            ? config.error.message
            : panel.editing
              ? 'Không thể tải cấu hình. Bản đang sửa vẫn được giữ lại.'
              : 'Không thể tải cấu hình. Vui lòng thử lại.'}
        </p>
      )}
      {!config.data && !config.isError && (
        <p role="status" className="m-0 text-[13px] text-[#707975]">
          Đang tải cấu hình…
        </p>
      )}
      {config.data && !panel.editing && <AiRoutingSummary view={config.data} updatedByName={updatedByName} />}
      {panel.editing && (
        <AiRoutingForm
          initial={panel.editing}
          pending={busy}
          error={save.error}
          onSave={panel.submit}
          onCancel={panel.cancel}
          onReload={() => void panel.reload()}
        />
      )}
      <AiRoutingRuntimeNotice />
      {!panel.editing && <AiRoutingCardActions state={state} panel={panel} disabled={busy} />}
    </article>
  );
}
