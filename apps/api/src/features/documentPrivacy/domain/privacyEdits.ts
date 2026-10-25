import { validRectangle } from './validRectangle.js';
export interface Rectangle {
  left: number;
  top: number;
  width: number;
  height: number;
}
export interface PrivacyEdits {
  rotation: 0 | 90 | 180 | 270;
  crop: Rectangle;
  masks: Rectangle[];
}
export function validPrivacyEdits(edits: PrivacyEdits): boolean {
  return (
    [0, 90, 180, 270].includes(edits.rotation) &&
    validRectangle(edits.crop) &&
    edits.masks.length <= 32 &&
    edits.masks.every(validRectangle)
  );
}
