import type { BodyMapProps, BodyMapView } from './bodyMapTypes';
import { getBodyMapRegions } from './getBodyMapRegions';
import { BodyMapDrawing } from './BodyMapDrawing';
import { BodyMapRegionButton } from './BodyMapRegionButton';

export function BodyMapFigure({
  view,
  selected,
  onSelect,
  trackingLocations = [],
}: BodyMapProps & { view: BodyMapView }) {
  const regions = getBodyMapRegions(view);
  return (
    <div
      role="group"
      aria-label={view === 'front' ? 'Vùng cơ thể mặt trước' : 'Vùng cơ thể mặt sau'}
      className="relative mx-auto h-[616px] w-full max-w-80"
    >
      <BodyMapDrawing regions={regions} selected={selected} />
      {regions.map((item) => (
        <BodyMapRegionButton
          key={`${item.region}/${item.side}`}
          item={item}
          active={selected?.region === item.region && selected.side === item.side}
          tracking={trackingLocations.some(
            ({ region, side }) => region === item.region && side === item.side,
          )}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
