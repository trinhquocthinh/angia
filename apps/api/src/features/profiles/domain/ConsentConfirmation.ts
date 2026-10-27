export type ConsentConfirmation =
  | { kind: 'attestation'; attestation: true; basis: 'self' | 'guardian'; respondentName: string }
  | { kind: 'self' };
