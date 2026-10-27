import type { VisionBillingObserver } from '@src/features/extraction/infrastructure/observeVisionCharge.js';
import type { ExtractionDependencies } from '@src/features/extraction/application/ports.js';
import { createFakeExtractor } from '@src/features/extraction/infrastructure/createFakeExtractor.js';
import { createFallbackExtractor } from '@src/features/extraction/infrastructure/createFallbackExtractor.js';
import { createOpenRouterExtractor } from '@src/features/extraction/infrastructure/createOpenRouterExtractor.js';
import { AiRoutingError } from '../application/AiRoutingError.js';
import { resolveExtractionSnapshot } from '../application/resolveExtractionSnapshot.js';
import type {
  AiRunMode,
  AiRoutingReader,
  ExtractionAttemptProvider,
  ExtractionSnapshot,
} from '../application/ports.js';

export interface RoutingRuntime extends VisionBillingObserver {
  runMode: AiRunMode;
  openRouterBaseUrl: string;
  openRouterApiKey?: string | undefined;
}

export function createExtractionAttempts(
  deps: ExtractionDependencies,
  reader: AiRoutingReader,
  runtime: RoutingRuntime,
  fetchFn: typeof fetch = fetch,
): ExtractionAttemptProvider {
  return {
    prepare: async () => {
      const startedAt = deps.budget.now().getTime();
      const view = await readRouting(reader);
      const snapshot = resolveExtractionSnapshot(view, runtime.runMode, new Date(startedAt));
      const extractor = createSnapshotExtractor(snapshot, runtime, fetchFn);
      return {
        snapshot,
        dependencies: { ...deps, extractor },
      };
    },
  };
}

async function readRouting(reader: AiRoutingReader) {
  try {
    return await reader.read();
  } catch (error) {
    if (error instanceof AiRoutingError) throw error;
    throw new AiRoutingError('routing_unavailable');
  }
}

function createSnapshotExtractor(
  snapshot: ExtractionSnapshot,
  runtime: RoutingRuntime,
  fetchFn: typeof fetch,
) {
  if (snapshot.runMode === 'fake') return createFakeExtractor();
  if (snapshot.provider === 'woku') {
    // CP5 chưa nối cổng phí tổng/quota và điều kiện upstream; không đọc ảnh hoặc gọi Woku thật.
    throw new AiRoutingError('woku_live_unavailable');
  }
  if (!runtime.openRouterApiKey?.trim()) throw new AiRoutingError('openrouter_key_missing');
  if (!runtime.observeCharge) throw new AiRoutingError('billing_source_missing');
  const adapter = (model: string) =>
    createOpenRouterExtractor(
      {
        baseUrl: runtime.openRouterBaseUrl,
        apiKey: runtime.openRouterApiKey!,
        model,
        observeCharge: runtime.observeCharge,
        onBillingObservationError: runtime.onBillingObservationError,
      },
      fetchFn,
    );
  return createFallbackExtractor(adapter(snapshot.primaryModel), adapter(snapshot.fallbackModel));
}
