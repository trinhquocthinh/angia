// Trạng thái giám hộ đơn giản cho unit test; tư cách và cạnh tranh kiểm trên PostgreSQL thật.
export function createMemoryProfileGuardianStore() {
  const guarded = new Set<string>();
  return {
    prepareGuardianCreator: async () => true,
    addCreatorGuardian: async (id: string) => {
      guarded.add(id);
    },
    clearProfileGuardians: async (id: string) => {
      guarded.delete(id);
    },
    hasProfileGuardian: async (id: string) => guarded.has(id),
  };
}
