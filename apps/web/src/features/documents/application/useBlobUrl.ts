import { useEffect, useMemo } from 'react';

/** Object URL cho một Blob trên máy; thu hồi khi Blob đổi hoặc component bị gỡ. */
export function useBlobUrl(blob: Blob | null): string | null {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);
  return url;
}
