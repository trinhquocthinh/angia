type BillingProvider = 'openrouter';
export interface BillingSource {
  id: string;
  provider: BillingProvider;
  apiKey: string;
}
export interface ProviderCharge {
  externalId: string;
  chargedAt: Date;
  counterAmount: string;
  unitDivisor: string;
}
export interface BillingSnapshot {
  counter: string;
  charges: ProviderCharge[];
}
export type BillingStatus =
  'complete' | 'gap' | 'error' | 'counter_reset' | 'credential_changed' | 'receipt_conflict';
export interface BillingLease {
  sourceId: string;
  token: string;
  lastCounter: string | null;
}
export interface BillingRepository {
  register(sources: BillingSource[]): Promise<void>;
  claim(sourceId: string): Promise<BillingLease | null>;
  finish(lease: BillingLease, snapshot: BillingSnapshot): Promise<void>;
  fail(lease: BillingLease, status: 'error' | 'receipt_conflict'): Promise<void>;
  observe(source: BillingSource, charge: ProviderCharge): Promise<void>;
}
export interface BillingReader {
  read(source: BillingSource): Promise<BillingSnapshot>;
}
