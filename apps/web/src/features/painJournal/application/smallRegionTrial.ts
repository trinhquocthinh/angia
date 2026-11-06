import type { BodyLocation } from './regionFromNodeName';

// Spike E18-S2-T2 (PD A20): 10 vùng nhỏ cần bấm trúng cả vùng lẫn bên ở 375 px.
export const SMALL_REGION_TARGETS: readonly BodyLocation[] = [
  { region: 'wrist', side: 'right' },
  { region: 'hand', side: 'left' },
  { region: 'elbow', side: 'right' },
  { region: 'ankle', side: 'left' },
  { region: 'neck', side: 'center' },
  { region: 'wrist', side: 'left' },
  { region: 'hand', side: 'right' },
  { region: 'elbow', side: 'left' },
  { region: 'ankle', side: 'right' },
  { region: 'knee', side: 'left' },
];

type TrialMiss = { target: BodyLocation; tapped: BodyLocation };
export type TrialState = { index: number; hits: number; misses: TrialMiss[] };

export const startTrial = (): TrialState => ({ index: 0, hits: 0, misses: [] });

export function recordTrialTap(state: TrialState, tapped: BodyLocation): TrialState {
  const target = SMALL_REGION_TARGETS[state.index];
  if (!target) return state;
  const hit = target.region === tapped.region && target.side === tapped.side;
  return {
    index: state.index + 1,
    hits: state.hits + (hit ? 1 : 0),
    misses: hit ? state.misses : [...state.misses, { target, tapped }],
  };
}
