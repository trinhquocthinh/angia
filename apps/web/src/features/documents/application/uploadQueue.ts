import { checkUploadFile, type FileProblem } from './checkUploadFile';
import type { DocumentType } from './ports';

// SPEC-008: tối đa 50 tệp mỗi lần chọn.
export const MAX_FILES_PER_PICK = 50;

// ready: chỉ nằm trên trình duyệt. Chỉ khi bấm "Xong" mới thành queued và được gửi (không sinh rác server).
type UploadStatus = 'ready' | 'queued' | 'uploading' | 'done' | 'failed' | 'rejected';
export interface UploadItem {
  id: string;
  file: File;
  // Gắn lúc bấm "Xong" theo hồ sơ/loại đang chọn.
  profileId: string | null;
  declaredType: DocumentType | null;
  status: UploadStatus;
  // Tăng mỗi lần thử lại: khóa chống gửi trùng theo id + lượt.
  attempt: number;
  progress: number;
  problem: FileProblem | null;
  error: string | null;
  // Object URL cục bộ cho ảnh xem trước; null với tệp bị loại.
  previewUrl: string | null;
  // ID chứng từ server trả về khi gửi xong, để mở thẳng màn duyệt.
  documentId?: string | null;
}
export type UploadAction =
  | { type: 'add'; items: UploadItem[] }
  | { type: 'submit'; profileId: string; declaredType: DocumentType | null }
  | { type: 'start'; id: string }
  | { type: 'progress'; id: string; percent: number }
  | { type: 'done'; id: string; documentId: string | null }
  | { type: 'fail'; id: string; message: string }
  | { type: 'retry' }
  | { type: 'remove'; id: string }
  | { type: 'dismissRejected' };

export function planUpload(
  files: File[],
  newId: () => string,
): { ok: true; items: UploadItem[] } | { ok: false; reason: 'too_many' } {
  if (files.length > MAX_FILES_PER_PICK) return { ok: false, reason: 'too_many' };
  const items = files.map((file): UploadItem => {
    const problem = checkUploadFile(file);
    return {
      id: newId(),
      file,
      profileId: null,
      declaredType: null,
      status: problem ? 'rejected' : 'ready',
      attempt: 0,
      progress: 0,
      problem,
      error: null,
      previewUrl: null,
    };
  });
  return { ok: true, items };
}

const update = (state: UploadItem[], id: string, patch: Partial<UploadItem>) =>
  state.map((item) => (item.id === id ? { ...item, ...patch } : item));

export function uploadQueueReducer(state: UploadItem[], action: UploadAction): UploadItem[] {
  switch (action.type) {
    case 'add':
      return [...state, ...action.items];
    case 'submit': {
      const { profileId, declaredType } = action;
      return state.map((item) =>
        item.status === 'ready' ? { ...item, status: 'queued', profileId, declaredType } : item,
      );
    }
    case 'start':
      return update(state, action.id, { status: 'uploading', progress: 0, error: null });
    case 'progress':
      return update(state, action.id, { progress: Math.min(100, Math.max(0, Math.round(action.percent))) });
    case 'done':
      return update(state, action.id, { status: 'done', progress: 100, documentId: action.documentId });
    case 'fail':
      return update(state, action.id, { status: 'failed', error: action.message });
    case 'retry':
      return state.map((item) =>
        item.status === 'failed'
          ? { ...item, status: 'queued', attempt: item.attempt + 1, progress: 0, error: null }
          : item,
      );
    case 'remove':
      return state.filter((item) => item.id !== action.id);
    case 'dismissRejected':
      return state.filter((item) => item.status !== 'rejected');
  }
}

// Gửi tuần tự: chỉ lấy ảnh kế tiếp khi không còn ảnh nào đang tải.
export function nextQueued(state: UploadItem[]): UploadItem | undefined {
  if (state.some((item) => item.status === 'uploading')) return undefined;
  return state.find((item) => item.status === 'queued' && item.profileId);
}

export function summarizeQueue(state: UploadItem[]) {
  const count = (...statuses: UploadStatus[]) =>
    state.filter((item) => statuses.includes(item.status)).length;
  return {
    ready: count('ready'),
    total: count('ready', 'queued', 'uploading', 'done', 'failed'),
    done: count('done'),
    active: count('queued', 'uploading'),
    failed: count('failed'),
    rejected: count('rejected'),
    firstDocumentId: state.find((item) => item.status === 'done' && item.documentId)?.documentId ?? null,
  };
}
