export type PainIssue = {
  readonly id: string;
  readonly healthProfileId: string;
  // Mã vùng và cặp vùng/bên được kiểm theo danh mục tại contracts.
  readonly region: string;
  readonly side: 'left' | 'right' | 'center';
  readonly title: string | null;
} & (
  | { readonly status: 'tracking'; readonly resolvedOn: null }
  | { readonly status: 'resolved'; readonly resolvedOn: string }
);
