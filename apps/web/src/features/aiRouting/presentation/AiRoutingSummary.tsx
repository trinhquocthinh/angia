import type { AiRoutingView } from '@angia/contracts';
import { AI_MODEL_LABELS } from './aiModelLabels';

const formatTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
});
const ROW = 'flex items-center justify-between gap-3 rounded-2xl border border-border/35 bg-bg px-3.5 py-3';
export function AiRoutingSummary({
  view,
  updatedByName,
}: {
  view: AiRoutingView;
  updatedByName: string | null;
}) {
  const models = view.settings.openrouter;
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2 text-caption">
        <span className="text-text-secondary">Nhà cung cấp đã lưu</span>
        <span className="rounded-full bg-accent-soft px-2.5 py-0.5 font-semibold text-accent">
          OpenRouter
        </span>
      </div>
      <dl className="m-0 grid gap-2.5 text-caption">
        <div className={ROW}>
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface text-caption font-semibold text-accent shadow-2xs">
              1
            </span>
            <div className="min-w-0">
              <dt className="text-caption text-text-secondary">Model chính</dt>
              <dd className="m-0 font-semibold text-text-primary [overflow-wrap:anywhere]">
                {AI_MODEL_LABELS[models.primaryModel]}
              </dd>
            </div>
          </div>
        </div>
        <div className={ROW}>
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface text-caption font-semibold text-text-secondary shadow-2xs">
              2
            </span>
            <div className="min-w-0">
              <dt className="text-caption text-text-secondary">Dự phòng</dt>
              <dd className="m-0 font-semibold text-text-primary [overflow-wrap:anywhere]">
                {AI_MODEL_LABELS[models.fallbackModel]}
              </dd>
            </div>
          </div>
        </div>
      </dl>
      <p className="m-0 text-caption text-text-secondary tabular-nums">
        {view.updatedAt
          ? `${formatTime.format(new Date(view.updatedAt))} · ${updatedByName ?? 'Tài khoản quản trị'}`
          : 'Chưa có lần lưu nào.'}
      </p>
    </div>
  );
}
