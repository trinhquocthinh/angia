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

const button = 'privacy-tool-btn';
const primary =
  'flex min-h-btn items-center justify-center rounded-2xl bg-accent px-5 text-button-secondary font-semibold text-on-accent shadow-stitch-sm transition-colors enabled:hover:bg-accent-hover disabled:opacity-40';

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
      <label className="flex min-h-btn cursor-pointer items-center gap-2.5 rounded-2xl border border-border/35 bg-bg px-3.5 text-caption font-semibold text-text-primary">
        <input
          type="checkbox"
          checked={clean}
          disabled={working}
          onChange={(e) => onClean(e.target.checked)}
          className="h-5 w-5 accent-accent"
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
        <p role="alert" className="w-full text-body font-medium text-warning">
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
