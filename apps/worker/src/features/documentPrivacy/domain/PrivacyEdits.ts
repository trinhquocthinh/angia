export interface PrivacyRectangle {
  left: number;
  top: number;
  width: number;
  height: number;
}
export interface PrivacyEdits {
  rotation: 0 | 90 | 180 | 270;
  crop: PrivacyRectangle;
  masks: PrivacyRectangle[];
}
export interface PixelPrivacyEdits {
  crop: PrivacyRectangle;
  masks: PrivacyRectangle[];
}
