export interface LegalDocument {
  id: string;
  kind: 'terms' | 'privacy';
  version: string;
  publishedAt: string;
  material: boolean;
  url: string;
}

export interface CurrentLegalDocuments {
  terms: LegalDocument;
  privacy: LegalDocument;
}

export interface LegalRepository {
  current(): Promise<CurrentLegalDocuments>;
  status(accountId: string): Promise<{ accepted: boolean; missingDocuments: boolean }>;
  accept(
    accountId: string,
    versionIds: string[],
  ): Promise<{
    ok: boolean;
    current: { termsVersionId: string; privacyVersionId: string };
  }>;
}
