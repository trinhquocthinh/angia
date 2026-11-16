import type { AiBillingView, AiRoutingView, AdminScanQuotaView } from '@angia/contracts';

const month = '2026-11';
const zero = '0.000000000000';
const billing: AiBillingView = {
  month,
  unit: 'USD',
  status: 'unconfigured',
  confirmedSpendUsd: zero,
  actualSpendUsd: null,
  lastSyncedAt: null,
  sources: [],
};
const routing: AiRoutingView = {
  version: 0,
  settings: {
    openrouter: {
      primaryModel: 'google/gemini-3.1-flash-lite',
      fallbackModel: 'moonshotai/kimi-k2.6',
    },
  },
  updatedAt: null,
  updatedBy: null,
};
const quotas: AdminScanQuotaView = {
  month,
  version: 0,
  policy: null,
  monthlyCapUsd: zero,
  actualSpendUsd: null,
  billingStatus: 'unconfigured',
  committedRemainingScans: '0',
  availableAdditionalScans: null,
  overAllocatedScans: null,
  families: [],
  runtimeActive: true,
};

export function enrollmentAdminResponse(path: string): unknown {
  switch (path) {
    case '/api/admin/families':
    case '/api/admin/accounts':
      return [];
    case '/api/admin/extraction-cap':
      return { month, monthlyCapUsd: 0, spentThisMonthUsd: 0 };
    case '/api/admin/ai-billing':
      return billing;
    case '/api/admin/ai-routing':
      return routing;
    case '/api/admin/scan-quotas':
      return quotas;
    default:
      return undefined;
  }
}
