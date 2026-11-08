import type { BodyRegion } from '@angia/contracts';

export const regionGroups = [
  {
    label: 'Đầu và thân',
    regions: ['head', 'neck', 'chest', 'abdomen', 'upper_back', 'lower_back', 'pelvis'],
  },
  {
    label: 'Tay',
    regions: ['shoulder', 'upper_arm', 'elbow', 'forearm', 'wrist', 'hand'],
  },
  {
    label: 'Chân',
    regions: ['hip', 'buttock', 'thigh', 'knee', 'shin', 'calf', 'ankle', 'foot'],
  },
] as const satisfies readonly { label: string; regions: readonly BodyRegion[] }[];
