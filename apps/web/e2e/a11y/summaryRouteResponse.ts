import type { components } from '../../src/shared/api/schema.gen.js';
import { selfPainData } from '../selfPainData.js';

export function summaryRouteResponse(url: URL): components['schemas']['VisitSummary'] {
  const { summary, detail } = selfPainData('member');
  return {
    profile: summary,
    createdAt: '2026-11-26T00:00:00Z',
    from: url.searchParams.get('from') ?? '2026-10-26',
    to: url.searchParams.get('to') ?? '2026-11-26',
    showsVitals: false,
    currentMedications: [],
    measurements: [],
    latestLabResults: [],
    adherencePeriods: [],
    painIssues: [
      {
        region: detail.region,
        side: detail.side,
        title: detail.title,
        status: detail.status,
        resolvedOn: detail.resolvedOn,
        entries: detail.entries.map(({ recordedAt, level, note, createdBy }) => ({
          recordedAt,
          level,
          note,
          createdBy,
        })),
        exercises: [],
      },
    ],
    disclaimer: 'Tài liệu tổng hợp từ gia đình, không phải chỉ định y khoa.',
  };
}
