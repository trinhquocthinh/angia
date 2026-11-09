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
      className={`absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border p-0.5 text-[10px] leading-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${active ? 'border-accent bg-accent-soft' : 'border-border bg-surface'}`}
      onClick={() => onSelect({ region, side })}
    >
      <span aria-hidden="true">{bodyRegions[region].label.split(',')[0]}</span>
      {tracking && (
        <span
          data-tracking-dot=""
          aria-hidden="true"
          className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-text-secondary"
        />
      )}
    </button>
  );
}
