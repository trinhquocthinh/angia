export type MedicationCoursePeriod = {
  readonly startDate: string;
} & (
  | { readonly status: 'active'; readonly endDate: string | null }
  | { readonly status: 'ended' | 'stopped' | 'replaced'; readonly endDate: string }
);
