import { SMALL_REGION_TARGETS, type TrialState } from '../../application/smallRegionTrial';
import { describeLocation } from './describeLocation';
import type { LoadStats } from './readLoadStats';

type Props = {
  load: LoadStats | null;
  fps: { fps: number; worstMs: number } | null;
  trial: TrialState;
  onResetTrial: () => void;
};

const kb = (bytes: number | null) => (bytes ? `${(bytes / 1024).toFixed(1)} KiB` : 'cache/không rõ');

// Bảng số đo cho E18-S2-T2: owner đọc trên máy thật rồi chép vào hồ sơ spike.
export function SpikeStats({ load, fps, trial, onResetTrial }: Props) {
  const target = SMALL_REGION_TARGETS[trial.index];
  const total = SMALL_REGION_TARGETS.length;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 text-xs" data-testid="spike-stats">
      <dt>Màn hình</dt>
      <dd>{`${window.innerWidth} px · dpr ${window.devicePixelRatio}`}</dd>
      <dt>Sẵn sàng</dt>
      <dd>{load ? `${load.readyMs} ms từ lúc mở trang` : '…'}</dd>
      <dt>GLB</dt>
      <dd>{load?.glbMs != null ? `${load.glbMs} ms · ${kb(load.glbBytes)}` : '…'}</dd>
      <dt>FPS xoay</dt>
      <dd>{fps ? `${fps.fps} (khung chậm nhất ${fps.worstMs} ms)` : 'Giữ và xoay ≥ 1 giây'}</dd>
      <dt>Vùng nhỏ</dt>
      <dd>
        {target
          ? `${trial.index + 1}/${total}: chạm ${describeLocation(target)} · trúng ${trial.hits}`
          : `Trúng ${trial.hits}/${total}`}{' '}
        <button type="button" className="underline" onClick={onResetTrial}>
          Làm lại
        </button>
      </dd>
      {trial.misses.map(({ target: want, tapped }) => (
        <dd key={`${want.region}:${want.side}`} className="col-start-2 text-danger">
          {`Trượt ${describeLocation(want)} → ${describeLocation(tapped)}`}
        </dd>
      ))}
    </dl>
  );
}
