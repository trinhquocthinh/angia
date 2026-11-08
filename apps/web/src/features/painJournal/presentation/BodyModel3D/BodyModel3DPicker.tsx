import type { BodyLocation } from '../../application/regionFromNodeName';
import { describeBodyLocation } from '../BodyMap2D/describeBodyLocation';
import { BodyModel3D } from './BodyModel3D';

type Props = {
  selected: BodyLocation | null;
  onSelect: (location: BodyLocation) => void;
  onUnavailable: () => void;
};

// SPEC-058: chế độ 3D phụ trong bước "Chọn vùng"; cùng nhãn và cách báo vùng đã chọn như 2D.
export function BodyModel3DPicker({ selected, onSelect, onUnavailable }: Props) {
  return (
    <div className="space-y-3 text-text-primary">
      <div className="h-96 overflow-hidden rounded-xl border border-border">
        <BodyModel3D selected={selected} onSelect={onSelect} onUnavailable={onUnavailable} />
      </div>
      <p className="text-center text-xs text-text-secondary">
        Kéo để xoay, chụm để phóng. Trái, phải theo người trong hình
      </p>
      <p aria-live="polite" aria-atomic="true" className="min-h-6 text-center text-sm">
        {selected ? `Đã chọn: ${describeBodyLocation(selected)}` : 'Chạm vào một vùng trên mô hình'}
      </p>
    </div>
  );
}
