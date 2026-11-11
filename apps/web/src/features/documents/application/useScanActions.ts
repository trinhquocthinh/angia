import { useCallback } from 'react';
import type { UploadAction } from './uploadQueue';

type Urls = {
  create: (key: string, blob: Blob) => string;
  revoke: (key: string) => void;
};

/** SPEC-084: ảnh nắn thay nguồn che (khoá URL `id:scan`); bản xuất cũ (`id:thumb`) không còn khớp nên thu hồi. */
export function useScanActions(
  dispatch: (action: UploadAction) => void,
  create: Urls['create'],
  revoke: Urls['revoke'],
) {
  const scan = useCallback(
    (id: string, blob: Blob) => {
      const file = new File([blob], `${id}-scan.jpg`, { type: 'image/jpeg' });
      revoke(`${id}:thumb`);
      dispatch({ type: 'scanned', id, file, url: create(`${id}:scan`, file) });
    },
    [dispatch, create, revoke],
  );
  const unscan = useCallback(
    (id: string) => {
      [`${id}:scan`, `${id}:thumb`].forEach(revoke);
      dispatch({ type: 'unscan', id });
    },
    [dispatch, revoke],
  );
  return { scan, unscan };
}
