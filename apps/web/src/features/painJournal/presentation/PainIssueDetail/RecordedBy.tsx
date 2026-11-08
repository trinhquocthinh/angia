import type { ActorRef } from '@angia/contracts';

export function RecordedBy({ createdBy, updatedBy }: { createdBy: ActorRef; updatedBy?: ActorRef }) {
  return (
    <p className="text-sm text-text-secondary">
      {`Ghi bởi ${createdBy?.displayName ?? 'Tài khoản đã xóa'}${
        updatedBy && updatedBy.accountId !== createdBy?.accountId ? ` · sửa bởi ${updatedBy.displayName}` : ''
      }`}
    </p>
  );
}
