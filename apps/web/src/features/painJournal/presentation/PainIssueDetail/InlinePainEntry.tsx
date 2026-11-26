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
    <section aria-label="Ghi nhanh" className="profile-bento-card p-5 sm:p-6">
      <h2 className="auth-heading mb-4 text-heading-2 font-semibold text-accent">
        Ghi nhanh mức đau lúc này
      </h2>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void state.submit(state.needsReopen);
        }}
      >
        <fieldset disabled={state.pending} aria-busy={state.pending} className="space-y-4 border-0 p-0">
          <FirstPainEntryFields values={state.values} onChange={state.change} />
          {state.error && (
            <p role="alert" className="rounded-2xl bg-danger-soft p-3 text-body text-danger">
              {state.error}
            </p>
          )}
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
