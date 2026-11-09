import type { AdherencePeriod } from '@src/features/adherence/domain/AdherencePeriod.js';
import type { LabResult } from '@src/features/labResults/domain/LabResult.js';
import type { Measurement } from '@src/features/measurements/domain/Measurement.js';
import type { MedicationCourse } from '@src/features/medications/domain/MedicationCourse.js';

// BR-035: dòng miễn trừ cố định nguyên văn trên mọi bản tóm tắt in/xuất.
export const VISIT_SUMMARY_DISCLAIMER = 'Tài liệu tổng hợp từ gia đình, không phải chỉ định y khoa.';

export interface VisitSummaryProfile {
  id: string;
  displayName: string;
  birthYear: number | null;
}

// BR-064: chỉ dữ liệu người dùng nhập (vùng, mức, ghi chú, bài tập); không nhận định (BR-033).
export interface VisitSummaryPainIssue {
  region: string;
  side: 'left' | 'right' | 'center';
  title: string | null;
  status: 'tracking' | 'resolved';
  resolvedOn: string | null;
  entries: {
    recordedAt: string;
    level: number;
    note: string | null;
    createdBy: { accountId: string; displayName: string } | null;
  }[];
  exercises: {
    name: string;
    source: 'prescribed' | 'self';
    prescriber: string | null;
    startDate: string;
    endDate: string | null;
    note: string | null;
  }[];
}

// SPEC-024: chỉ dữ liệu đã duyệt (BR-013); không có trường nhận xét/đánh giá (BR-033).
export interface VisitSummary<Course extends MedicationCourse = MedicationCourse> {
  profile: VisitSummaryProfile;
  createdAt: Date;
  from: string;
  to: string;
  showsVitals: boolean;
  currentMedications: Course[];
  measurements: Measurement[];
  latestLabResults: LabResult[];
  adherencePeriods: AdherencePeriod[];
  painIssues: VisitSummaryPainIssue[];
  disclaimer: typeof VISIT_SUMMARY_DISCLAIMER;
}
