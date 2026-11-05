import type { DocumentDeletionImpact } from '@angia/contracts';

export function DeleteDocumentImpact({ impact }: { impact: DocumentDeletionImpact }) {
  const counts = [
    [impact.prescriptions, `${impact.prescriptions} đơn thuốc`],
    [impact.prescriptionItems, `${impact.prescriptionItems} dòng thuốc`],
    [impact.labResults, `${impact.labResults} kết quả xét nghiệm`],
    [impact.measurements, `${impact.measurements} số đo`],
    [
      impact.medicationCourses,
      `${impact.medicationCourses} đợt thuốc, trong đó ${impact.activeMedicationCourses} đợt đang dùng`,
    ],
  ] as const;
  return (
    <ul className="list-inside list-disc text-sm">
      {counts
        .filter(([count]) => count > 0)
        .map(([, label]) => (
          <li key={label}>{label}</li>
        ))}
    </ul>
  );
}
