/** Khung che theo đơn vị 1.000.000 trên ảnh đã xoay — cùng hệ toạ độ PrivacyEdits (SPEC-083). */
export interface SuggestionRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const SUGGESTION_UNIT = 1_000_000;
/** Trần số khung trả về sau khi gộp (BR-085). */
export const MAX_SUGGESTIONS = 64;
