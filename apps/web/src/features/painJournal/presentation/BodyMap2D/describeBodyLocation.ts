import { bodyRegions } from '@angia/contracts';
import type { BodyLocation } from '../../application/regionFromNodeName';

const sideLabels = { left: 'trái', right: 'phải', center: null } as const;

export function describeBodyLocation({ region, side }: BodyLocation): string {
  return [bodyRegions[region].label, sideLabels[side]].filter(Boolean).join(' · ');
}
