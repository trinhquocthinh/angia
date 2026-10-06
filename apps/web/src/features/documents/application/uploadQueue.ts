import { checkUploadFile, type FileProblem } from './checkUploadFile';
import type { DocumentType } from './ports';

// SPEC-008: tối đa 50 tệp mỗi lần chọn. API hiện nhận 1 tệp/request nên UI gửi lần lượt từng ảnh.
export const MAX_FILES_PER_PICK = 50;

type UploadStatus = 'queued' | 'uploading' | 'done' | 'failed' | 'rejected';
export interface UploadItem {
  id: string;
  file: File;
  profileId: string;
  declaredType: DocumentType | null;
  status: UploadStatus;
  // Tăng mỗi lần thử lại: khóa chống gửi trùng theo id + lượt.
  attempt: number;
  progress: number;
  problem: FileProblem | null;
  error: string | null;
  // Object URL cục bộ cho ảnh xem trước; null với HEIC/tệp bị loại.
  previewUrl: string | null;
}
export type UploadAction =
  | { type: 'add'; items: UploadItem[] }
  | { type: 'start'; id: string }
  | { type: 'progress'; id: string; percent: number }
  | { type: 'done'; id: string }
  | { type: 'fail'; id: string; message: string }
  | { type: 'retry' }
  | { type: 'remove'; id: string }
  | { type: 'dismissRejected' };

export function planUpload(
  files: File[],
  target: { profileId: string; declaredType: DocumentType | null },
  newId: () => string,
): { ok: true; items: UploadItem[] } | { ok: false; reason: 'too_many' } {
  if (files.length > MAX_FILES_PER_PICK) return { ok: false, reason: 'too_many' };
  const items = files.map((file): UploadItem => {
    const problem = checkUploadFile(file);
    const status = problem ? 'rejected' : 'queued';
    return {
      id: newId(),
      file,
      ...target,
      status,
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
    case 'start':
      return update(state, action.id, { status: 'uploading', progress: 0, error: null });
    case 'progress':
      return update(state, action.id, { progress: Math.min(100, Math.max(0, Math.round(action.percent))) });
    case 'done':
      return update(state, action.id, { status: 'done', progress: 100 });
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
  return state.find((item) => item.status === 'queued');
}

export function summarizeQueue(state: UploadItem[]) {
  const count = (...statuses: UploadStatus[]) =>
    state.filter((item) => statuses.includes(item.status)).length;
  return {
    total: count('queued', 'uploading', 'done', 'failed'),
    done: count('done'),
    active: count('queued', 'uploading'),
    failed: count('failed'),
    rejected: count('rejected'),
  };
}
