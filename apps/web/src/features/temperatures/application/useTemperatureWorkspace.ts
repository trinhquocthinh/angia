import { useState } from 'react';
import type { RecordTemperatureRequest, TemperatureReading } from '@angia/contracts';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { vietnamDate } from '@src/features/visitSummary/application/vietnamDate';
import type { TemperatureRepository } from './ports';
import { useTemperatures } from './useTemperatures';
import { useTemperatureMutation, type TemperatureMutationResult } from './useTemperatureMutation';

export function useTemperatureWorkspace(
  repository: TemperatureRepository,
  session: ProfileSession,
  profileId: string,
  readOnly: boolean,
  consentConfirmed: boolean,
) {
  const [range, setRange] = useState(() => ({ from: vietnamDate(), to: vietnamDate() }));
  const [recording, setRecording] = useState(false);
  const [removing, setRemoving] = useState<TemperatureReading | null>(null);
  const query = useTemperatures(repository, session, profileId, range, readOnly, consentConfirmed);
  const mutation = useTemperatureMutation(session, profileId);
  const editable = !readOnly && consentConfirmed && session.role === 'main' && Boolean(session.family);
  const record = async (request: RecordTemperatureRequest): Promise<TemperatureMutationResult> => {
    if (!editable) return 'failed';
    const result = await mutation.run(() => repository.record(profileId, request, session.csrfToken));
    if (result === 'saved') setRecording(false);
    return result;
  };
  const remove = async () => {
    if (!editable || !removing) return;
    const result = await mutation.run(() => repository.remove(profileId, removing.id, session.csrfToken));
    if (result === 'saved') setRemoving(null);
  };
  return {
    range,
    setRange,
    recording,
    setRecording,
    removing,
    setRemoving,
    query,
    mutation,
    editable,
    record,
    remove,
  };
}
