import type { BodyMapProps, BodyMapRegion } from './bodyMapTypes';
import { bodyMapLayout } from './bodyMapLayout';

export function BodyMapDrawing({
  regions,
  selected,
}: {
  regions: BodyMapRegion[];
  selected: BodyMapProps['selected'];
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 616"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {regions.map(({ region, side, path, mirrored }) => {
        const active = selected?.region === region && selected.side === side;
        const [anchorX, anchorY, buttonX, buttonY] = bodyMapLayout[region];
        const transform = mirrored ? 'translate(320 0) scale(-1 1)' : undefined;
        return (
          <g key={`${region}/${side}`}>
            <path
              data-body-region={`${region}/${side}`}
              transform={transform}
              d={path}
              fill={active ? '#E3EFEA' : '#ECE8E2'}
              stroke={active ? '#2F6F5E' : '#9AA3A1'}
              strokeWidth={active ? 2 : 1}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={anchorX}
              y1={anchorY}
              x2={buttonX}
              y2={buttonY}
              transform={transform}
              stroke="#55615F"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}
    </svg>
  );
}
