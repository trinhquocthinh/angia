import type { LabSeriesGroup } from '../domain/groupLabSeries.js';
import { toLabResultResponse } from './toLabResultResponse.js';

export function toLabSeriesResponse(groups: LabSeriesGroup[]) {
  return groups.map((group) => ({
    testName: group.testName,
    results: group.results.map(toLabResultResponse),
  }));
}
