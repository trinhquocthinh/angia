import { useState } from 'react';
import { BodyMap2D } from '../BodyMap2D/BodyMap2D';
import { RegionList } from '../RegionList/RegionList';
import type { RegionStepProps } from './newPainIssueTypes';
export function NewPainIssueRegionStep({ selected, onSelect, issues }: RegionStepProps) {
  const [mode, setMode] = useState<'image' | 'list'>('image');
  return (
    <div className="space-y-4 lg:mx-auto lg:max-w-md">
      <div role="group" aria-label="Cách chọn vùng" className="flex gap-2">
        {(['image', 'list'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className="min-h-11 rounded-xl border border-border px-4 aria-pressed:bg-accent-soft"
          >
            {value === 'image' ? 'Hình' : 'Danh sách'}
          </button>
        ))}
      </div>
      {mode === 'image' ? (
        <BodyMap2D
          selected={selected}
          onSelect={onSelect}
          trackingLocations={issues.filter((issue) => issue.status === 'tracking')}
        />
      ) : (
        <RegionList selected={selected} onSelect={onSelect} />
      )}
    </div>
  );
}
