export function parseSendToAi(raw: string | undefined, fileCount: number): boolean[] | null {
  if (raw === undefined) return Array<boolean>(fileCount).fill(false);
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) &&
      value.length === fileCount &&
      value.every((item: unknown) => typeof item === 'boolean')
      ? value
      : null;
  } catch {
    return null;
  }
}
