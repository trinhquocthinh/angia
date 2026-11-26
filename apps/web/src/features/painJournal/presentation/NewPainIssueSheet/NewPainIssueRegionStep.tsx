import { useState } from 'react';
import { BodyMap2D } from '../BodyMap2D/BodyMap2D';
import { BodyModel3DPicker } from '../BodyModel3D/BodyModel3DPicker';
import { hasWebGL } from '../BodyModel3D/hasWebGL';
import { RegionList } from '../RegionList/RegionList';
import {
  type RegionPickerMode,
  readRegionPickerMode,
  saveRegionPickerMode,
} from '../../infrastructure/regionPickerModeStorage';
import type { RegionStepProps } from './newPainIssueTypes';

const labels: Record<RegionPickerMode, string> = { image: 'Hình', list: 'Danh sách', '3d': '3D' };

export function NewPainIssueRegionStep({ selected, onSelect, issues }: RegionStepProps) {
  const [webgl] = useState(hasWebGL);
  const [mode, setMode] = useState<RegionPickerMode>(() => readRegionPickerMode(webgl));
  const [failed3d, setFailed3d] = useState(false);
  const choose = (value: RegionPickerMode) => {
    setMode(value);
    saveRegionPickerMode(value);
  };
  // TC-730: 3D lỗi thì quay về "Hình", nhớ lại "Hình" và báo cho người dùng.
  const fallBack = () => {
    choose('image');
    setFailed3d(true);
  };
  const modes: RegionPickerMode[] = webgl && !failed3d ? ['image', 'list', '3d'] : ['image', 'list'];
  return (
    <div className="space-y-4 lg:mx-auto lg:max-w-lg">
      <div
        role="group"
        aria-label="Cách chọn vùng"
        className="grid auto-cols-fr grid-flow-col gap-1.5 rounded-2xl bg-surface-container-high p-1.5"
      >
        {modes.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => choose(value)}
            className="min-h-btn cursor-pointer rounded-xl px-4 text-button-secondary font-semibold text-text-secondary transition-colors hover:text-text-primary aria-pressed:bg-surface aria-pressed:font-bold aria-pressed:text-accent aria-pressed:shadow-2xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {labels[value]}
          </button>
        ))}
      </div>
      {failed3d && (
        <p role="status" className="rounded-2xl border border-border/35 bg-accent-soft p-3.5 text-body">
          Không mở được chế độ 3D trên thiết bị này.
        </p>
      )}
      {mode === 'image' && (
        <BodyMap2D
          selected={selected}
          onSelect={onSelect}
          trackingLocations={issues.filter((issue) => issue.status === 'tracking')}
        />
      )}
      {mode === 'list' && <RegionList selected={selected} onSelect={onSelect} />}
      {mode === '3d' && (
        <BodyModel3DPicker selected={selected} onSelect={onSelect} onUnavailable={fallBack} />
      )}
    </div>
  );
}
