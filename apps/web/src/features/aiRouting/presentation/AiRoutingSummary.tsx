import type { AiRoutingView } from '@angia/contracts';
import { AI_MODEL_LABELS } from './aiModelLabels';

const formatTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
});
const ROW =
  'flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl bg-[#eaf6f5]/70 px-3 py-2.5';
export function AiRoutingSummary({
  view,
  updatedByName,
}: {
  view: AiRoutingView;
  updatedByName: string | null;
}) {
  const models = view.settings.openrouter;
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-[#404945]">Nhà cung cấp đã lưu</span>
        <span className="font-semibold text-[#004135]">OpenRouter</span>
      </div>
      <dl className="m-0 grid gap-2 text-[13px] leading-5">
        <div className={ROW}>
          <dt className="text-xs text-[#404945]">Model chính</dt>
          <dd className="m-0 font-medium text-[#131d1d]">{AI_MODEL_LABELS[models.primaryModel]}</dd>
        </div>
        <div className={ROW}>
          <dt className="text-xs text-[#404945]">Dự phòng</dt>
          <dd className="m-0 font-medium text-[#131d1d]">{AI_MODEL_LABELS[models.fallbackModel]}</dd>
        </div>
      </dl>
      <p className="m-0 text-xs leading-[18px] text-[#55615f]">
        {view.updatedAt
          ? `${formatTime.format(new Date(view.updatedAt))} · ${updatedByName ?? 'Tài khoản quản trị'}`
          : 'Chưa có lần lưu nào.'}
      </p>
    </div>
  );
}
