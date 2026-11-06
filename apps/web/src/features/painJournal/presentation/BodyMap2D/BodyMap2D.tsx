import { useState } from 'react';
import { BackSvg } from './back.svg';
import type { BodyMapProps, BodyMapView } from './bodyMapTypes';
import { describeBodyLocation } from './describeBodyLocation';
import { FrontSvg } from './front.svg';

const views = { front: 'Mặt trước', back: 'Mặt sau' } as const;

export function BodyMap2D({ selected, onSelect }: BodyMapProps) {
  const [view, setView] = useState<BodyMapView>('front');
  const Figure = view === 'front' ? FrontSvg : BackSvg;
  return (
    <div className="space-y-3 text-text-primary">
      <div role="group" aria-label="Góc nhìn cơ thể" className="flex justify-center gap-2">
        {(Object.keys(views) as BodyMapView[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setView(value)}
            className={`min-h-11 rounded-full border px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${view === value ? 'border-accent bg-accent-soft' : 'border-border bg-surface'}`}
            aria-pressed={view === value}
          >
            {views[value]}
          </button>
        ))}
      </div>
      <div className="mx-auto flex max-w-80 justify-between px-8 text-sm text-text-secondary">
        <span>{view === 'front' ? 'Phải' : 'Trái'}</span>
        <span>{view === 'front' ? 'Trái' : 'Phải'}</span>
      </div>
      <Figure selected={selected} onSelect={onSelect} />
      <p className="text-center text-xs text-text-secondary">Trái, phải theo người trong hình</p>
      <p aria-live="polite" aria-atomic="true" className="min-h-6 text-center text-sm">
        {selected ? `Đã chọn: ${describeBodyLocation(selected)}` : 'Chọn một vùng trên hình'}
      </p>
    </div>
  );
}
