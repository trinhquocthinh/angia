// BR-031: giai đoạn dùng thực tế do main ghi nhận, độc lập với đợt chỉ định.
export type AdherenceStatus = 'taking' | 'stopped';

export interface AdherencePeriod {
  readonly id: string;
  readonly healthProfileId: string;
  readonly medicationName: string;
  readonly medicationNameNormalized: string;
  readonly status: AdherenceStatus;
  readonly fromDate: string;
  /** Null = giai đoạn đang mở (BR-032: mỗi thuốc tối đa một giai đoạn mở). */
  readonly toDate: string | null;
}

export type NewAdherencePeriod = Omit<AdherencePeriod, 'id' | 'toDate'> & { readonly recordedBy: string };
