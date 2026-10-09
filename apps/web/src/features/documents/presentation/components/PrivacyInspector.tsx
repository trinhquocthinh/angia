import type { ReactNode } from 'react';
import type { usePrivacyWorkspace } from '../../application/usePrivacyWorkspace';
import { PrivacyToolIcon } from './PrivacyToolIcon';
type Props = {
  workspace: ReturnType<typeof usePrivacyWorkspace>;
  preview: boolean;
  inputPending: boolean;
  fields: ReactNode;
  children?: ReactNode;
};
export function PrivacyInspector({ workspace, preview, inputPending, fields, children }: Props) {
  const { state, busy, query } = workspace;
  const creating = state.candidate.state === 'pending' || query.data?.draft.state === 'pending';
  return (
    <aside aria-label="Thông số điều khiển ảnh" className="flex min-w-0 flex-col gap-4 self-start">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#707975]">Thông số điều khiển</h3>
        {fields}
        {inputPending && (
          <p role="status" className="text-xs leading-5 text-[#9b472c]">
            Hoàn tất tọa độ hợp lệ hoặc nhấn Esc trước khi tạo bản kiểm tra.
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            if (!inputPending) void workspace.create();
          }}
          disabled={inputPending || busy || !preview || creating || query.isPending || query.isError}
          className="flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-[#004135] px-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#20594b] disabled:opacity-40"
        >
          <PrivacyToolIcon name="shield" />
          {creating ? 'Đang tạo bản kiểm tra…' : 'Tạo bản kiểm tra'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void workspace.manual()}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#e4f0f0] px-3 py-2.5 text-sm font-semibold text-[#286958] disabled:opacity-40"
        >
          <PrivacyToolIcon name="keyboard" />
          Chọn nhập tay (Không gửi AI)
        </button>
        {children}
        <p className="flex items-start gap-2 text-[11px] leading-4 text-[#707975]">
          <PrivacyToolIcon name="shield" />
          Vùng che đen được phủ trực tiếp lên bản kiểm tra. Chỉ gửi đúng ảnh bạn đã kiểm tra và xác nhận.
        </p>
      </div>
      <div className="rounded-2xl bg-[#eaf6f5] p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-[#602900]">
          <PrivacyToolIcon name="info" />
          Không tạo được bản kiểm tra?
        </h4>
        <p className="mt-2 text-xs leading-5 text-[#404945]">
          Thử cắt vùng nhỏ hơn chứa nội dung cần đọc, sau đó tạo lại hoặc chọn nhập tay.
        </p>
      </div>
    </aside>
  );
}
