import { useId, useRef, useState } from 'react';
import { ResolveSheet } from '../ResolveSheet/ResolveSheet';
import { ReopenDialog } from '../ReopenDialog/ReopenDialog';
import { DeletePainIssueDialog } from '../DeletePainIssueDialog/DeletePainIssueDialog';
import type { PainIssueLifecycleProps } from './painIssueLifecycleTypes';
type Action = 'resolve' | 'reopen' | 'delete';

function LifecycleMenu({
  id,
  tracking,
  onSelect,
}: {
  id: string;
  tracking: boolean;
  onSelect: (next: Action) => void;
}) {
  return (
    <div id={id} className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="inline-flex min-h-11 cursor-pointer items-center rounded-2xl border border-border/45 bg-bg px-4 text-caption font-semibold text-accent transition-colors hover:bg-accent-soft"
        onClick={() => onSelect(tracking ? 'resolve' : 'reopen')}
      >
        {tracking ? 'Đánh dấu đã khỏi' : 'Mở lại'}
      </button>
      <button
        type="button"
        className="inline-flex min-h-11 cursor-pointer items-center rounded-2xl bg-danger-soft px-4 text-caption font-semibold text-danger transition-colors hover:bg-danger-soft/80"
        onClick={() => onSelect('delete')}
      >
        Xóa vấn đề
      </button>
    </div>
  );
}

export function PainIssueLifecycleActions(props: Omit<PainIssueLifecycleProps, 'onClose'>) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const open = (next: Action) => {
    trigger.current?.focus();
    setExpanded(false);
    setAction(next);
  };
  const dialogProps = {
    ...props,
    onClose: () => setAction(null),
    onSaved: (message: string) => {
      setAction(null);
      props.onSaved(message);
    },
  };
  return (
    <div
      className="flex flex-wrap items-center justify-end gap-2"
      onKeyDown={(e) => {
        if (expanded && e.key === 'Escape') {
          setExpanded(false);
          trigger.current?.focus();
        }
      }}
    >
      {expanded && <LifecycleMenu id={id} tracking={props.issue.status === 'tracking'} onSelect={open} />}
      <button
        ref={trigger}
        type="button"
        aria-label="Tùy chọn vấn đề"
        aria-expanded={expanded}
        aria-controls={id}
        className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-2xl border border-border/45 bg-bg px-3 font-semibold text-text-primary transition-colors hover:bg-accent-soft hover:text-accent"
        onClick={() => setExpanded((v) => !v)}
      >
        <span aria-hidden="true">⋯</span>
      </button>
      {action === 'resolve' && <ResolveSheet {...dialogProps} />}
      {action === 'reopen' && <ReopenDialog {...dialogProps} />}
      {action === 'delete' && <DeletePainIssueDialog {...dialogProps} />}
    </div>
  );
}
