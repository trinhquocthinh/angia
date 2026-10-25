export type LabGroupId =
  | 'glucose'
  | 'kidney'
  | 'liver'
  | 'lipid'
  | 'blood'
  | 'urine'
  | 'cardiac'
  | 'electrolyte'
  | 'thyroid'
  | 'other';

export interface LabCatalogEntry {
  group: Exclude<LabGroupId, 'other'>;
  aliases: readonly string[];
  note: string;
}

// Thứ tự hiển thị nhóm trên tab "Kết quả xét nghiệm" (Design LG-01); "Khác" luôn cuối.
export const LAB_GROUPS: readonly { id: LabGroupId; label: string }[] = [
  { id: 'glucose', label: 'Đường huyết' },
  { id: 'kidney', label: 'Chức năng thận' },
  { id: 'liver', label: 'Chức năng gan' },
  { id: 'lipid', label: 'Mỡ máu' },
  { id: 'blood', label: 'Công thức máu' },
  { id: 'urine', label: 'Nước tiểu' },
  { id: 'cardiac', label: 'Tim mạch' },
  { id: 'electrolyte', label: 'Điện giải' },
  { id: 'thyroid', label: 'Tuyến giáp' },
  { id: 'other', label: 'Khác' },
];

// Từ điển tra cứu (BR-022 làm rõ 2026-10-25): chỉ kiến thức phổ thông, ghi chú chỉ nói chỉ số đo gì,
// không chứa khoảng tham chiếu. Alias ở dạng đã chuẩn hóa (thường, bỏ dấu, không khoảng trắng quanh "-").
// Mã ngắn mơ hồ giữa máu và nước tiểu (GLU, PRO, BLD, LEU, pH, BIL, ERY) cố ý không có mặt.
export const LAB_CATALOG: readonly LabCatalogEntry[] = [
  {
    group: 'glucose',
    aliases: [
      'glucose',
      'glucose mau',
      'duong huyet',
      'duong huyet doi',
      'duong huyet luc doi',
      'glucose doi',
    ],
    note: 'Lượng đường (glucose) trong máu',
  },
  { group: 'glucose', aliases: ['hba1c', 'hb a1c'], note: 'Đường huyết trung bình khoảng 2–3 tháng gần đây' },
  { group: 'kidney', aliases: ['ure', 'urea', 'bun'], note: 'Chất thải từ chuyển hóa đạm, do thận đào thải' },
  { group: 'kidney', aliases: ['creatinin', 'creatinine'], note: 'Chất thải từ cơ bắp, do thận lọc ra' },
  { group: 'kidney', aliases: ['egfr', 'mlct', 'muc loc cau than'], note: 'Ước tính mức lọc của thận' },
  {
    group: 'kidney',
    aliases: ['acid uric', 'axit uric', 'uric acid'],
    note: 'Chất thải từ chuyển hóa purin',
  },
  { group: 'liver', aliases: ['ast', 'got', 'sgot'], note: 'Men gan AST' },
  { group: 'liver', aliases: ['alt', 'gpt', 'sgpt'], note: 'Men gan ALT' },
  { group: 'liver', aliases: ['ggt', 'gamma gt'], note: 'Men gan GGT' },
  {
    group: 'liver',
    aliases: ['bilirubin', 'bilirubin toan phan', 'bilirubin truc tiep', 'bilirubin gian tiep'],
    note: 'Sắc tố mật, do gan xử lý',
  },
  { group: 'liver', aliases: ['albumin'], note: 'Loại đạm chính trong máu, do gan tạo ra' },
  { group: 'liver', aliases: ['protein toan phan', 'total protein'], note: 'Tổng lượng đạm trong máu' },
  {
    group: 'lipid',
    aliases: ['cholesterol', 'cholesterol toan phan', 'total cholesterol'],
    note: 'Tổng lượng cholesterol trong máu',
  },
  {
    group: 'lipid',
    aliases: ['triglycerid', 'triglyceride', 'triglycerides'],
    note: 'Chất béo trung tính trong máu',
  },
  { group: 'lipid', aliases: ['hdl-c', 'hdl', 'hdl cholesterol'], note: 'Cholesterol gắn HDL' },
  { group: 'lipid', aliases: ['ldl-c', 'ldl', 'ldl cholesterol'], note: 'Cholesterol gắn LDL' },
  { group: 'blood', aliases: ['hong cau', 'so luong hong cau', 'rbc'], note: 'Số lượng hồng cầu' },
  {
    group: 'blood',
    aliases: ['huyet sac to', 'hemoglobin', 'hgb'],
    note: 'Lượng huyết sắc tố mang oxy trong máu',
  },
  { group: 'blood', aliases: ['hematocrit', 'hct'], note: 'Tỷ lệ thể tích hồng cầu trong máu' },
  { group: 'blood', aliases: ['bach cau', 'so luong bach cau', 'wbc'], note: 'Số lượng bạch cầu' },
  { group: 'blood', aliases: ['tieu cau', 'so luong tieu cau', 'plt'], note: 'Số lượng tiểu cầu' },
  {
    group: 'blood',
    aliases: ['mcv', 'mch', 'mchc'],
    note: 'Kích thước / lượng huyết sắc tố trung bình của hồng cầu',
  },
  { group: 'urine', aliases: ['protein nieu', 'protein nuoc tieu'], note: 'Lượng đạm trong nước tiểu' },
  { group: 'urine', aliases: ['glucose nieu', 'glucose nuoc tieu'], note: 'Lượng đường trong nước tiểu' },
  { group: 'urine', aliases: ['hong cau nieu', 'hong cau nuoc tieu'], note: 'Hồng cầu trong nước tiểu' },
  { group: 'urine', aliases: ['bach cau nieu', 'bach cau nuoc tieu'], note: 'Bạch cầu trong nước tiểu' },
  {
    group: 'urine',
    aliases: ['nitrit', 'nitrite', 'ketone', 'ket', 'ty trong nuoc tieu', 'sg', 'urobilinogen', 'uro'],
    note: 'Thành phần đo trong nước tiểu',
  },
  {
    group: 'cardiac',
    aliases: ['troponin', 'troponin i', 'troponin t', 'hs-troponin', 'hs-troponin i', 'hs-troponin t'],
    note: 'Protein của cơ tim đo trong máu',
  },
  { group: 'cardiac', aliases: ['ck-mb'], note: 'Men có nhiều ở cơ tim' },
  { group: 'cardiac', aliases: ['nt-probnp', 'bnp'], note: 'Chất do tim tiết ra, đo trong máu' },
  { group: 'electrolyte', aliases: ['natri', 'sodium', 'na+'], note: 'Nồng độ natri trong máu' },
  { group: 'electrolyte', aliases: ['kali', 'potassium', 'k+'], note: 'Nồng độ kali trong máu' },
  { group: 'electrolyte', aliases: ['clo', 'clorua', 'chloride', 'cl-'], note: 'Nồng độ clo trong máu' },
  {
    group: 'electrolyte',
    aliases: ['canxi', 'calci', 'calcium', 'ca++', 'ca2+'],
    note: 'Nồng độ canxi trong máu',
  },
  { group: 'thyroid', aliases: ['tsh'], note: 'Hormone kích thích tuyến giáp' },
  { group: 'thyroid', aliases: ['ft4', 'ft3'], note: 'Hormone tuyến giáp dạng tự do' },
];
