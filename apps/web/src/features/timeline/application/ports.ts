import type { TimelinePage } from '@angia/contracts';

export interface TimelineRepository {
  list(profileId: string, cursor: string | null, signal?: AbortSignal): Promise<TimelinePage>;
}
