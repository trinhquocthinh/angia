import { bodyRegions } from '@angia/contracts';
import type { BodyMapProps, BodyMapRegion } from './bodyMapTypes';
import { bodyMapLayout } from './bodyMapLayout';

type Props = Pick<BodyMapProps, 'onSelect'> & {
  item: BodyMapRegion;
  active: boolean;
  tracking: boolean;
};

export function BodyMapRegionButton({ item, active, tracking, onSelect }: Props) {
  const { region, side, label, mirrored } = item;
  const [, , x, y] = bodyMapLayout[region];
  return (
    <button
      type="button"
      aria-label={`${label}${tracking ? ' · đang theo dõi' : ''}`}
      aria-pressed={active}
      title={label}
      style={{ left: `${((mirrored ? 320 - x : x) / 320) * 100}%`, top: y }}
      className={`absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl border p-0.5 text-caption font-semibold shadow-2xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${active ? 'border-accent bg-accent-soft text-accent shadow-stitch-sm' : 'border-border/60 bg-surface text-text-primary hover:border-accent hover:bg-accent-soft hover:text-accent'}`}
      onClick={() => onSelect({ region, side })}
    >
      <span aria-hidden="true">{bodyRegions[region].label.split(',')[0]}</span>
      {tracking && (
        <span
          data-tracking-dot=""
          aria-hidden="true"
          className="absolute right-1 top-1 size-1.5 rounded-full bg-text-secondary"
        />
      )}
    </button>
  );
}
