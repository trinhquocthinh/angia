import { bodyRegions, type BodyRegion } from '@angia/contracts';
import { bodyMapPaths } from './bodyMapPaths';
import type { BodyMapRegion, BodyMapView } from './bodyMapTypes';
import { describeBodyLocation } from './describeBodyLocation';

const hiddenRegions: Record<BodyMapView, ReadonlySet<BodyRegion>> = {
  front: new Set(['upper_back', 'lower_back', 'buttock', 'calf']),
  back: new Set(['chest', 'abdomen', 'pelvis', 'shin']),
};

export function getBodyMapRegions(view: BodyMapView): BodyMapRegion[] {
  return (Object.keys(bodyRegions) as BodyRegion[]).flatMap((region) => {
    if (hiddenRegions[view].has(region)) return [];
    return bodyRegions[region].sides.map((side) => ({
      region,
      side,
      label: describeBodyLocation({ region, side }),
      path: bodyMapPaths[region],
      mirrored: side === (view === 'front' ? 'left' : 'right'),
    }));
  });
}
