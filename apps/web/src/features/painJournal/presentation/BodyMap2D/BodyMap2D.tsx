import { useState } from 'react';
import { BackSvg } from './back.svg';
import type { BodyMapProps, BodyMapView } from './bodyMapTypes';
import { describeBodyLocation } from './describeBodyLocation';
import { FrontSvg } from './front.svg';

const views = { front: 'Mặt trước', back: 'Mặt sau' } as const;

export function BodyMap2D({ selected, onSelect, trackingLocations = [] }: BodyMapProps) {
  const [view, setView] = useState<BodyMapView>('front');
  const Figure = view === 'front' ? FrontSvg : BackSvg;
  return (
    <div className="space-y-3 text-text-primary sm:rounded-3xl sm:border sm:border-border/35 sm:bg-bg sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="group"
          aria-label="Góc nhìn cơ thể"
          className="inline-flex rounded-2xl bg-surface-container-high p-1"
        >
          {(Object.keys(views) as BodyMapView[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setView(value)}
              className={`min-h-11 rounded-xl px-4 text-caption font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${view === value ? 'bg-surface text-accent shadow-2xs' : 'text-text-secondary hover:text-text-primary'}`}
              aria-pressed={view === value}
            >
              {views[value]}
            </button>
          ))}
        </div>
        <p className="text-caption text-text-secondary">Trái, phải theo người trong hình</p>
      </div>
      <div className="py-2 sm:rounded-2xl sm:border sm:border-border/30 sm:bg-surface sm:py-3 sm:shadow-inner">
        <div className="mx-auto mb-1 flex max-w-80 justify-between px-8 text-caption font-semibold text-text-secondary">
          <span>{view === 'front' ? 'Phải' : 'Trái'}</span>
          <span>{view === 'front' ? 'Trái' : 'Phải'}</span>
        </div>
        <Figure selected={selected} onSelect={onSelect} trackingLocations={trackingLocations} />
      </div>
      <p
        aria-live="polite"
        aria-atomic="true"
        className={`flex min-h-11 items-center justify-center rounded-2xl border px-4 py-2 text-center text-body font-semibold ${selected ? 'border-accent/45 bg-accent-soft text-accent' : 'border-border/35 bg-surface text-text-secondary'}`}
      >
        {selected ? `Đã chọn: ${describeBodyLocation(selected)}` : 'Chọn một vùng trên hình'}
      </p>
    </div>
  );
}
