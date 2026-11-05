import {
  currentMedicationsSchema,
  labSeriesResponseSchema,
  measurementSeriesSchema,
  revisitListSchema,
  selfProfileSchema,
  selfReminderListSchema,
  timelinePageSchema,
} from '@angia/contracts';
import { readStoppingResponse } from '@src/features/medications/infrastructure/readStoppingResponse';
import { apiClient } from '@src/shared/api/apiClient';
import type { SelfProfileRepository } from '../application/ports';

const FALLBACK = 'Không thể tải hồ sơ của bạn. Vui lòng thử lại.';
const options = (signal?: AbortSignal) => ({ cache: 'no-store' as const, signal: signal ?? null });

export function createSelfProfileRepository(client = apiClient): SelfProfileRepository {
  return {
    profile: async (signal) =>
      selfProfileSchema.parse(
        readStoppingResponse(await client.GET('/api/me/profile', options(signal)), FALLBACK),
      ),
    medications: async (signal) =>
      currentMedicationsSchema.parse(
        readStoppingResponse(
          await client.GET('/api/me/profile/medications/current', options(signal)),
          FALLBACK,
        ),
      ),
    reminders: async (signal) =>
      selfReminderListSchema.parse(
        readStoppingResponse(await client.GET('/api/me/profile/reminders', options(signal)), FALLBACK),
      ),
    revisits: async (signal) =>
      revisitListSchema.parse(
        readStoppingResponse(await client.GET('/api/me/profile/revisits', options(signal)), FALLBACK),
      ),
    timeline: async (cursor, signal) =>
      timelinePageSchema.parse(
        readStoppingResponse(
          await client.GET('/api/me/profile/timeline', {
            ...options(signal),
            params: { query: { limit: 50, ...(cursor ? { cursor } : {}) } },
          }),
          FALLBACK,
        ),
      ),
    measurementSeries: async (kind, { from, to }, signal) =>
      measurementSeriesSchema.parse(
        readStoppingResponse(
          await client.GET('/api/me/profile/measurements/series', {
            ...options(signal),
            params: { query: { kind, from, to, displayGlucoseUnit: 'mmol/L' } },
          }),
          FALLBACK,
        ),
      ),
    labSeries: async (signal) =>
      labSeriesResponseSchema.parse(
        readStoppingResponse(
          await client.GET('/api/me/profile/lab-result-series', options(signal)),
          FALLBACK,
        ),
      ),
  };
}
