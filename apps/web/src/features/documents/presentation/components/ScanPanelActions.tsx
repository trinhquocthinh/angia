import type { ScanStep, ScanStepAction } from '../../application/scanPanelStep';
import type { ScanStatus } from '../../application/useDocumentScan';

type Props = {
  step: ScanStep['step'];
  status: ScanStatus;
  valid: boolean;
  clean: boolean;
  onClean: (clean: boolean) => void;
  onPreview: () => void;
  onStep: (action: ScanStepAction) => void;
  onCancel: () => void;
};

const button =
  'flex min-h-11 items-center rounded-xl bg-accent-soft px-3 text-xs font-semibold text-text-primary transition-colors enabled:hover:bg-border disabled:opacity-40';
const primary =
  'flex min-h-11 items-center rounded-xl bg-accent px-3 text-xs font-semibold text-on-accent disabled:opacity-40';

function CornerActions({
  status,
  valid,
  clean,
  onClean,
  onPreview,
  onCancel,
}: Omit<Props, 'step' | 'onStep'>) {
  const working = status === 'working';
  return (
    <>
      <label className="flex min-h-11 items-center gap-2 text-xs font-semibold text-text-primary">
        <input
          type="checkbox"
          checked={clean}
          disabled={working}
          onChange={(e) => onClean(e.target.checked)}
        />
        Làm sạch nền
      </label>
      <button type="button" className={primary} disabled={!valid || working} onClick={onPreview}>
        {working ? 'Đang nắn ảnh…' : 'Xem ảnh nắn'}
      </button>
      <button type="button" className={button} disabled={working} onClick={onCancel}>
        Huỷ
      </button>
    </>
  );
}

// SPEC-084 §3: nút theo từng bước; hỏi lại trước khi ảnh nắn xoá vùng che đang có.
export function ScanPanelActions(props: Props) {
  const { step, onStep, onCancel } = props;
  if (step === 'corners') return <CornerActions {...props} />;
  if (step === 'confirm')
    return (
      <>
        <p role="alert" className="w-full text-[13px] font-medium text-warning">
          Nắn ảnh sẽ xoá vùng cắt và vùng che hiện có. Bạn sẽ cần che lại trên ảnh nắn.
        </p>
        <button type="button" className={primary} onClick={() => onStep({ type: 'confirmed' })}>
          Vẫn dùng ảnh nắn
        </button>
        <button type="button" className={button} onClick={() => onStep({ type: 'keep' })}>
          Huỷ
        </button>
      </>
    );
  return (
    <>
      <button type="button" className={primary} onClick={() => onStep({ type: 'use', hasMasks: false })}>
        Dùng ảnh này
      </button>
      <button type="button" className={button} onClick={() => onStep({ type: 'adjust' })}>
        Chỉnh lại góc
      </button>
      <button type="button" className={button} onClick={onCancel}>
        Huỷ
      </button>
    </>
  );
}
