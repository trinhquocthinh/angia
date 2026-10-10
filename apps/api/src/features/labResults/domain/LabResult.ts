// BR-022: giữ nguyên văn tên, giá trị, đơn vị và khoảng tham chiếu in trên phiếu.
export interface LabResult {
  id: string;
  healthProfileId: string;
  sourceDocumentId: string | null;
  resultDate: string;
  testName: string;
  value: string;
  unit: string | null;
  referenceRange: string | null;
  facility: string | null;
  manualWithoutSource: boolean;
  createdAt: Date;
}

export type NewLabResult = Omit<LabResult, 'id' | 'createdAt'>;
