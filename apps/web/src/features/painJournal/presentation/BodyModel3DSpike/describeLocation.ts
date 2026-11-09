import { bodyRegions } from '@angia/contracts';
import type { BodyLocation } from '../../application/regionFromNodeName';

const SIDE_LABEL = { left: 'Trái', right: 'Phải', center: null } as const;

export const describeLocation = ({ region, side }: BodyLocation) =>
  [bodyRegions[region].label, SIDE_LABEL[side]].filter(Boolean).join(' · ');
