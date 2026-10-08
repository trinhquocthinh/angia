import { classifyFile } from '../domain/classifyFile.js';
import { documentObjectKey } from '../domain/documentObjectKey.js';
import {
  type DocumentOutcome,
  type DocumentType,
  MAX_FILES_PER_UPLOAD,
  type SourceDocument,
  type UploadBatch,
  type UploadedFile,
} from '../domain/SourceDocument.js';
import type { DocumentDependencies, DocumentStore } from './ports.js';

interface UploadRequest {
  familyId: string;
  accountId: string;
  profileId: string;
  files: UploadedFile[];
  declaredType?: DocumentType | undefined;
}

// Số tệp kiểm trước, không cần DB (route đã chặn lô quá trần ngay lúc nhận multipart);
// sau đó theo flowchart SPEC-008: hồ sơ → đồng thuận (BR-009) → từng tệp.
// Object S3 ghi trong transaction; mọi lỗi (kể cả commit) xóa object đã ghi để không mồ côi.
// Job convert-heic ghi cùng transaction nên chỉ tồn tại khi chứng từ đã commit.
export async function uploadDocument(
  deps: DocumentDependencies,
  request: UploadRequest,
): Promise<DocumentOutcome<UploadBatch>> {
  const { files } = request;
  if (files.length === 0) return { ok: false, code: 'ERR_VALIDATION' };
  if (files.length > MAX_FILES_PER_UPLOAD) return { ok: false, code: 'ERR_BATCH_TOO_LARGE' };
  const storedKeys: string[] = [];
  try {
    return await deps.repository.withFamily(request.familyId, (store) =>
      storeUpload(deps, store, request, storedKeys),
    );
  } catch (error) {
    await Promise.allSettled(storedKeys.map((key) => deps.storage.delete(key)));
    throw error;
  }
}

async function storeUpload(
  deps: DocumentDependencies,
  store: DocumentStore,
  request: UploadRequest,
  storedKeys: string[],
): Promise<DocumentOutcome<UploadBatch>> {
  const profile = await store.findProfile(request.profileId);
  if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
  if (profile.consentStatus !== 'confirmed') return { ok: false, code: 'ERR_CONSENT_REQUIRED' };
  const checked = request.files.map((file) => ({ file, result: classifyFile(file.head, file.sizeBytes) }));
  const rejectedFiles = checked.flatMap(({ file, result }) =>
    result.ok ? [] : [{ fileName: file.fileName, code: result.code }],
  );
  if (rejectedFiles.length === checked.length) return { ok: false, code: 'ERR_NO_VALID_FILE' };
  const batchId = deps.newId();
  await store.insertBatch({ id: batchId, healthProfileId: request.profileId, createdBy: request.accountId });
  const documents: SourceDocument[] = [];
  for (const { file, result } of checked) {
    if (!result.ok) continue;
    const id = deps.newId();
    const location = { familyId: request.familyId, healthProfileId: request.profileId, documentId: id };
    const originalKey = documentObjectKey(location, result.extension);
    // Ghi tuần tự theo luồng: bộ nhớ không tăng theo kích thước lô. Ghi khóa trước khi put
    // để lỗi mất phản hồi sau khi S3 đã nhận vẫn được dọn (xóa khóa chưa tồn tại là vô hại).
    storedKeys.push(originalKey);
    await deps.storage.put(originalKey, file.open(), result.mimeType, file.sizeBytes);
    documents.push(
      await store.insertDocument({
        id,
        healthProfileId: request.profileId,
        batchId,
        type: request.declaredType ?? null,
        originalKey,
        mimeType: result.mimeType,
        sizeBytes: file.sizeBytes,
      }),
    );
    await store.enqueuePreview(id);
  }
  return { ok: true, value: { id: batchId, documents, rejectedFiles } };
}
