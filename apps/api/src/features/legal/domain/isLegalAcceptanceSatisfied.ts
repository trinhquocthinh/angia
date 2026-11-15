import type { LegalRequirement } from './LegalRequirement.js';

export function isLegalAcceptanceSatisfied(requirements: readonly LegalRequirement[]): boolean {
  return (['terms', 'privacy'] as const).every((kind) => {
    const requirement = requirements.find((item) => item.kind === kind);
    if (!requirement?.acceptedPublishedAt) return false;
    const required = requirement.materialPublishedAt ?? requirement.currentPublishedAt;
    return requirement.acceptedPublishedAt.getTime() >= required.getTime();
  });
}
