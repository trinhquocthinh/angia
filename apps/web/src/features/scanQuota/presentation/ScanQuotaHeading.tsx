import { AdminCardHeading } from '@src/features/family/presentation/components/AdminCardHeading';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

export function ScanQuotaHeading({ month }: { month: string | null }) {
  return (
    <AdminCardHeading
      id="scan-quota-title"
      icon={<AdminIcon name="upload_file" />}
      title="Hạn mức lượt nhận diện"
      aside={
        month && (
          <span className="shrink-0 rounded-full bg-[#e4f0f0] px-2.5 py-1 text-xs font-medium text-[#404945]">
            Tháng {month}
          </span>
        )
      }
    />
  );
}
