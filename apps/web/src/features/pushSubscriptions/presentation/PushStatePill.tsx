import type { PushStateView } from '../application/describePushState';

const tones: Record<PushStateView['tone'], string> = {
  active: 'bg-[#aef0da] text-[#055141]',
  neutral: 'bg-[#e4f0f0] text-[#404945]',
  warning: 'bg-[#ffdbcf] text-[#7a2e14]',
};
export function PushStatePill({ state }: { state: PushStateView }) {
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[state.tone]}`}>
      {state.label}
    </span>
  );
}
