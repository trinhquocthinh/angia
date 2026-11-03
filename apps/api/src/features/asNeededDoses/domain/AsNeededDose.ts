export type DoseInterval = { readonly text: string; readonly source: 'prescription' | 'user' };

// Đợt cùng khoảng cách hai nguồn: đủ để kiểm điều kiện ghi liều (BR-054) và đọc khoảng cách.
export interface AsNeededCourse {
  readonly id: string;
  readonly prescriptionItemId: string | null;
  readonly slots: readonly string[];
  readonly startDate: string;
  readonly endDate: string | null;
  readonly minIntervalText: string | null;
  readonly userIntervalText: string | null;
}

export interface NewAsNeededDose {
  readonly healthProfileId: string;
  readonly courseId: string;
  readonly givenAt: Date;
  readonly quantity: number | null;
  readonly unit: string | null;
  readonly recordedBy: string;
}

export type AsNeededDose = Omit<NewAsNeededDose, 'healthProfileId' | 'recordedBy'> & {
  readonly id: string;
  readonly recordedBy: string | null;
  readonly recordedAt: Date;
};
