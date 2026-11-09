import { useId, useRef, useState } from 'react';
import { ResolveSheet } from '../ResolveSheet/ResolveSheet';
import { ReopenDialog } from '../ReopenDialog/ReopenDialog';
import { DeletePainIssueDialog } from '../DeletePainIssueDialog/DeletePainIssueDialog';
import type { PainIssueLifecycleProps } from './painIssueLifecycleTypes';
export function PainIssueLifecycleActions(props: Omit<PainIssueLifecycleProps, 'onClose'>) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [action, setAction] = useState<'resolve' | 'reopen' | 'delete' | null>(null);
  const open = (next: typeof action) => {
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
      onKeyDown={(e) => {
        if (expanded && e.key === 'Escape') {
          setExpanded(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label="Tùy chọn vấn đề"
        aria-expanded={expanded}
        aria-controls={id}
        className="min-h-11 min-w-11 rounded-lg border border-border px-3"
        onClick={() => setExpanded((v) => !v)}
      >
        <span aria-hidden="true">⋯</span>
      </button>
      {expanded && (
        <div id={id} className="flex flex-wrap gap-2">
          <button
            type="button"
            className="min-h-11 px-3 underline"
            onClick={() => open(props.issue.status === 'tracking' ? 'resolve' : 'reopen')}
          >
            {props.issue.status === 'tracking' ? 'Đánh dấu đã khỏi' : 'Mở lại'}
          </button>
          <button type="button" className="min-h-11 px-3 underline" onClick={() => open('delete')}>
            Xóa vấn đề
          </button>
        </div>
      )}
      {action === 'resolve' && <ResolveSheet {...dialogProps} />}
      {action === 'reopen' && <ReopenDialog {...dialogProps} />}
      {action === 'delete' && <DeletePainIssueDialog {...dialogProps} />}
    </div>
  );
}
