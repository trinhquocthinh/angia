import { useState } from 'react';
import { ModalDialog } from '../src/shared/ui/ModalDialog';
import { ModalHeader } from '../src/shared/ui/ModalHeader';
import { SidePanel } from '../src/shared/ui/SidePanel';
import { SidePanelFooter } from '../src/shared/ui/SidePanelFooter';
import { Button } from '../src/shared/ui/button/Button';

export function FoundationDialog({
  placement,
  onClose,
}: {
  placement: 'modal' | 'side';
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  const content = (
    <>
      <div className="min-h-0 overflow-y-auto p-4">
        <p>Nội dung kiểm thử sheet</p>
        <Button variant="secondary" onClick={() => setPending((value) => !value)}>
          {pending ? 'Cho phép đóng' : 'Giả lập đang lưu'}
        </Button>
      </div>
      <SidePanelFooter
        submitLabel="Lưu thông tin"
        cancelLabel="Hủy"
        disabled={pending}
        submit={false}
        cancelDisabled={pending}
        onCancel={onClose}
      />
    </>
  );
  if (placement === 'side')
    return (
      <SidePanel
        titleId="side-title"
        title="Thông tin thử"
        subtitle="Nội dung giải thích"
        closeLabel="Đóng hộp thoại"
        pending={pending}
        onClose={onClose}
      >
        {content}
      </SidePanel>
    );
  return (
    <ModalDialog labelledBy="title" onCancel={onClose} pending={pending} width="md">
      <ModalHeader
        titleId="title"
        title="Thông tin thử"
        eyebrow="Thông tin"
        subtitle="Nội dung giải thích"
        icon="i"
        tone="accent"
        pending={pending}
        onClose={onClose}
        closeLabel="Đóng hộp thoại"
      />
      {content}
    </ModalDialog>
  );
}
