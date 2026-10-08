let pending: Promise<void> = Promise.resolve();

// Một slot dùng chung cho các adapter xử lý ảnh trong cùng tiến trình worker.
export function withImageProcessingSlot<T>(work: () => Promise<T>): Promise<T> {
  const previous = pending;
  let release!: () => void;
  pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  return previous.then(work).finally(release);
}
