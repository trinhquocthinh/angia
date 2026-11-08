import { FirstPainEntryFields } from '../NewPainIssueSheet/FirstPainEntryFields';
import { QuickPainEntryFooter } from '../QuickPainEntrySheet/QuickPainEntryFooter';
import { useQuickPainEntrySheet } from '../QuickPainEntrySheet/useQuickPainEntrySheet';
import type { QuickPainEntryProps } from '../QuickPainEntrySheet/quickPainEntryTypes';
import { useState } from 'react';
import type { PainIssueHandoff } from '../../application/painIssueHandoff';
import type { PainIssueReader } from '../../application/ports';
import { QuickPainEntryHandoff } from '../QuickPainEntrySheet/QuickPainEntryHandoff';

export function InlinePainEntry(
  props: QuickPainEntryProps & { api: QuickPainEntryProps['api'] & PainIssueReader },
) {
  const [handoff, setHandoff] = useState<Extract<PainIssueHandoff, { kind: 'existing' }> | null>(null);
  const continueIssue = (result: PainIssueHandoff) => {
    if (result.kind === 'existing') setHandoff(result);
  };
  const state = useQuickPainEntrySheet({ ...props, onContinueIssue: continueIssue });
  return (
    <section aria-label="Ghi nhanh" className="rounded-xl border border-border p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void state.submit(state.needsReopen);
        }}
      >
        <fieldset disabled={state.pending} aria-busy={state.pending} className="space-y-3">
          <FirstPainEntryFields values={state.values} onChange={state.change} />
          {state.error && <p role="alert">{state.error}</p>}
        </fieldset>
        <QuickPainEntryFooter state={state} />
      </form>
      {handoff && (
        <QuickPainEntryHandoff
          {...props}
          handoff={handoff}
          onContinueIssue={continueIssue}
          onClose={() => setHandoff(null)}
        />
      )}
    </section>
  );
}
