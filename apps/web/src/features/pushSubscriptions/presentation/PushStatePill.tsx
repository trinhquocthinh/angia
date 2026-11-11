import type { PushStateView } from '../application/describePushState';

const tones: Record<PushStateView['tone'], string> = {
  active: 'bg-accent-soft text-accent',
  neutral: 'bg-accent-soft text-text-secondary',
  warning: 'bg-warning-soft text-warning',
};
export function PushStatePill({ state }: { state: PushStateView }) {
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[state.tone]}`}>
      {state.label}
    </span>
  );
}
