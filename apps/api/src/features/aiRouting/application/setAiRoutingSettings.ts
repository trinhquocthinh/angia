import type { AiRoutingView, UpdateAiRoutingRequest } from '@angia/contracts';
import type { AiRoutingDependencies } from './ports.js';

type Outcome = { ok: true; view: AiRoutingView } | { ok: false; code: 'ERR_AI_ROUTING_CONFLICT' };

// Actor lấy từ phiên đã xác thực; CAS và audit phải cùng transaction ở repository.
export async function setAiRoutingSettings(
  deps: AiRoutingDependencies,
  input: UpdateAiRoutingRequest,
  actorId: string,
): Promise<Outcome> {
  const view = await deps.repository.compareAndSet({
    expectedVersion: input.expectedVersion,
    settings: input.settings,
    updatedBy: actorId,
    updatedAt: deps.now(),
  });
  return view ? { ok: true, view } : { ok: false, code: 'ERR_AI_ROUTING_CONFLICT' };
}
