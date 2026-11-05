export interface ConsentReceipt {
  consentStatus: 'confirmed';
  consentSource: 'main_attested' | 'self';
  consentConfirmedAt: Date;
  consentConfirmedBy: string;
  consentBasis: 'self' | 'guardian';
  consentRespondentName: string;
}
