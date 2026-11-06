import type { BodyMapProps, BodyMapView } from './bodyMapTypes';
import { getBodyMapRegions } from './getBodyMapRegions';

export function BodyMapFigure({ view, selected, onSelect }: BodyMapProps & { view: BodyMapView }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 576"
      role="group"
      aria-label={view === 'front' ? 'Vùng cơ thể mặt trước' : 'Vùng cơ thể mặt sau'}
      className="mx-auto block w-full max-w-80"
    >
      {getBodyMapRegions(view).map(({ region, side, label, path, mirrored }) => {
        const active = selected?.region === region && selected.side === side;
        return (
          <g
            key={`${region}/${side}`}
            role="button"
            tabIndex={0}
            aria-label={label}
            aria-pressed={active}
            transform={mirrored ? 'translate(320 0) scale(-1 1)' : undefined}
            className="cursor-pointer outline-none focus-visible:stroke-accent focus-visible:stroke-[3]"
            fill={active ? '#E3EFEA' : '#ECE8E2'}
            stroke={active ? '#2F6F5E' : '#9AA3A1'}
            strokeWidth={active ? 2 : 1}
            strokeLinejoin="round"
            onClick={() => onSelect({ region, side })}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              onSelect({ region, side });
            }}
          >
            <title>{label}</title>
            <path d={path} vectorEffect="non-scaling-stroke" />
          </g>
        );
      })}
    </svg>
  );
}
