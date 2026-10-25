import { AdminRequestError } from '../../application/AdminRequestError';
import type { useFamilyCaps } from '../../application/useFamilyCaps';
import { FamilyCapRow } from './FamilyCapRow';

// SPEC-031: trần chi phí đọc tự động riêng từng gia đình. Nâng trần → chứng từ chờ ngân sách của gia đình đó
// được đọc lại ngay; hạ trần → chứng từ mới của gia đình sẽ chờ ngân sách.
export function FamilyCapsCard({ caps, save }: ReturnType<typeof useFamilyCaps>) {
  return (
    <article
      className="admin-panel min-w-0 bg-white rounded-2xl p-4 sm:p-5 shadow-[0_1px_2px_#0000000d] flex flex-col gap-3 admin-reveal"
      aria-labelledby="family-caps-title"
    >
      <h2 id="family-caps-title" className="m-0 text-[16px] font-semibold text-[#004135]">
        Trần đọc tự động theo gia đình
      </h2>
      {caps.isError ? (
        <p role="alert" className="m-0 text-[13px] text-[#93000a]">
          {caps.error instanceof AdminRequestError ? caps.error.message : 'Không thể tải trần theo gia đình.'}
        </p>
      ) : caps.data ? (
        caps.data.map((cap) => (
          <FamilyCapRow
            key={cap.familyId}
            cap={cap}
            pending={save.isPending}
            onSave={(capUsd) => save.mutate({ familyId: cap.familyId, capUsd })}
          />
        ))
      ) : (
        <p className="m-0 text-[13px] text-[#707975]">Đang tải…</p>
      )}
      {save.isError && (
        <p role="alert" className="m-0 text-[13px] text-[#93000a]">
          Không lưu được trần. Vui lòng thử lại.
        </p>
      )}
    </article>
  );
}
