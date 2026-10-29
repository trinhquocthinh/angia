import type { LabResult } from '@src/features/labResults/domain/LabResult.js';
import type { Measurement } from '@src/features/measurements/domain/Measurement.js';
import type { Prescription } from '@src/features/prescriptions/domain/Prescription.js';
import type { DocumentStatus, DocumentType } from './SourceDocument.js';

/** Vị trí keyset: ngày mục, thời điểm lưu (chuỗi UTC micro giây) và id (SPEC-028). */
export interface EntryCursor {
  entryDate: string;
  createdKey: string;
  id: string;
}

/** Một mục danh mục: chứng từ ảnh hoặc đơn/phiếu XN nhập trực tiếp (gom theo lần lưu). */
export interface DocumentEntryHead {
  id: string;
  origin: 'document' | 'manual';
  type: DocumentType | null;
  status: DocumentStatus | 'manual_record';
  entryDate: string;
  dateKnown: boolean;
  createdAt: Date;
  createdKey: string;
  hasImage: boolean;
}

export interface EntryRecords {
  prescription: Prescription | null;
  labResults: LabResult[];
  measurements: Measurement[];
}

export type DocumentEntry = DocumentEntryHead & { records: EntryRecords };
