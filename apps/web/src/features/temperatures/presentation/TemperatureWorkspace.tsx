import type { ProfileSession } from '@src/features/profiles/application/ports';
import { useTemperatureWorkspace } from '../application/useTemperatureWorkspace';
import { createTemperatureRepository } from '../infrastructure/createTemperatureRepository';
import { TemperatureDeleteConfirmation } from './TemperatureDeleteConfirmation';
import { TemperatureRange } from './TemperatureRange';
import { TemperatureResults } from './TemperatureResults';
import { TemperatureSheet } from './TemperatureSheet';
import { TemperatureHeader } from './TemperatureHeader';

const repository = createTemperatureRepository();
type Props = { session: ProfileSession; profileId: string; readOnly?: boolean; consentConfirmed?: boolean };
export function TemperatureWorkspace({
  session,
  profileId,
  readOnly = false,
  consentConfirmed = true,
}: Props) {
  const state = useTemperatureWorkspace(repository, session, profileId, readOnly, consentConfirmed);
  const { query, mutation, editable } = state;
  if (!consentConfirmed) return <p role="alert">Hồ sơ chưa được đồng ý lưu dữ liệu.</p>;
  return (
    <section aria-label="Nhiệt độ" className="flex min-w-0 flex-col gap-4 rounded-xl bg-white p-5 shadow-sm">
      <TemperatureHeader
        editable={editable}
        pending={mutation.pending}
        onRecord={() => state.setRecording(true)}
      />
      <TemperatureRange
        initial={state.range}
        pending={mutation.pending || query.isFetching}
        onChange={(range) => {
          state.setRemoving(null);
          state.setRange(range);
        }}
      />
      <TemperatureResults
        readings={query.data?.readings}
        error={query.isError}
        retry={() => void query.refetch()}
        pending={mutation.pending}
        onRemove={editable ? state.setRemoving : undefined}
      />
      {editable && state.removing && (
        <TemperatureDeleteConfirmation
          reading={state.removing}
          pending={mutation.pending}
          onConfirm={() => void state.remove()}
          onCancel={() => state.setRemoving(null)}
        />
      )}
      {!state.recording && mutation.error && (
        <p role="alert" className="text-sm text-[#b42318]">
          {mutation.error}
        </p>
      )}
      {editable && state.recording && (
        <TemperatureSheet
          pending={mutation.pending}
          error={mutation.error}
          onSave={state.record}
          onClose={() => state.setRecording(false)}
        />
      )}
    </section>
  );
}
