import type { AiRoutingView } from '@angia/contracts';
import { AI_MODEL_LABELS } from './aiModelLabels';

const formatTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
});
export function AiRoutingSummary({
  view,
  updatedByName,
}: {
  view: AiRoutingView;
  updatedByName: string | null;
}) {
  const selected = view.settings.selectedProvider;
  const models = view.settings[selected];
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-[#707975]">Nhà cung cấp đã lưu</span>
        <span className="rounded-md bg-[#e4f0f0] px-2 py-1 text-[12px] font-semibold text-[#004135]">
          {selected === 'woku' ? 'Woku' : 'OpenRouter'}
        </span>
      </div>
      <dl className="m-0 grid gap-2 text-[12px] leading-5">
        <div className="flex flex-wrap justify-between gap-x-3">
          <dt className="text-[#707975]">Model chính</dt>
          <dd className="m-0 font-medium text-[#131d1d]">{AI_MODEL_LABELS[models.primaryModel]}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-3">
          <dt className="text-[#707975]">Dự phòng</dt>
          <dd className="m-0 font-medium text-[#131d1d]">{AI_MODEL_LABELS[models.fallbackModel]}</dd>
        </div>
      </dl>
      <p className="m-0 text-[11px] leading-[18px] text-[#707975]">
        {view.updatedAt
          ? `${formatTime.format(new Date(view.updatedAt))} · ${updatedByName ?? 'Tài khoản quản trị'}`
          : 'Chưa có lần lưu nào.'}
      </p>
    </div>
  );
}
