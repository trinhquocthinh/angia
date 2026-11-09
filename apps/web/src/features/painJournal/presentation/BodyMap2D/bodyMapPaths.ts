import type { BodyRegion } from '@angia/contracts';

// Hình tự vẽ trong viewBox 320 × 576. Vùng đôi mô tả nửa trái màn hình,
// phản chiếu qua x = 160 khi cần; không phản chiếu nhãn chữ.
const upperTorso = 'M128 102 Q160 112 192 102 L201 164 Q160 182 119 164 Z';
const lowerTorso = 'M119 164 Q160 182 201 164 L191 228 Q160 244 129 228 Z';
const lowerLeg = 'M123 416 Q136 424 151 416 L147 502 L127 502 L120 453 Z';

export const bodyMapPaths = {
  head: 'M160 14 C126 14 130 52 139 66 Q144 78 160 78 Q176 78 181 66 C190 52 194 14 160 14 Z',
  neck: 'M148 77 L172 77 L173 98 L192 102 Q160 112 128 102 L147 98 Z',
  chest: upperTorso,
  abdomen: lowerTorso,
  upper_back: upperTorso,
  lower_back: lowerTorso,
  pelvis: 'M129 228 Q160 244 191 228 L196 266 Q179 282 160 266 Q141 282 124 266 Z',
  shoulder: 'M128 102 Q111 96 101 114 L96 138 L117 145 L128 129 Z',
  upper_arm: 'M96 138 L117 145 L106 194 L85 187 Z',
  elbow: 'M85 187 L106 194 L100 216 L79 209 Z',
  forearm: 'M79 209 L100 216 L81 277 L65 273 Q68 240 79 209 Z',
  wrist: 'M65 273 L81 277 L77 296 L61 292 Z',
  hand: 'M61 292 L77 296 L78 316 L68 337 Q60 344 51 335 L53 314 Z',
  hip: 'M129 228 L124 254 L127 280 Q114 278 110 263 L112 239 L119 222 Z',
  buttock: 'M129 228 Q144 236 160 236 L160 266 Q145 287 127 280 L124 254 Z',
  thigh: 'M127 280 Q143 286 156 278 L153 388 L122 388 L119 323 Z',
  knee: 'M122 388 L153 388 L151 416 Q136 424 123 416 Z',
  shin: lowerLeg,
  calf: lowerLeg,
  ankle: 'M127 502 L147 502 L148 528 L126 528 Z',
  foot: 'M126 528 L148 528 L151 550 Q139 563 113 554 L114 543 Z',
} as const satisfies Record<BodyRegion, string>;
