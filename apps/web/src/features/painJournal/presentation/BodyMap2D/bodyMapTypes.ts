import type { BodyLocation } from '../../application/regionFromNodeName';

export type BodyMapView = 'front' | 'back';

export type BodyMapProps = {
  selected: BodyLocation | null;
  onSelect: (location: BodyLocation) => void;
};

export type BodyMapRegion = BodyLocation & {
  label: string;
  path: string;
  mirrored: boolean;
};
