const SECTIONS = [
  { key: 'today', label: 'Thuốc hôm nay' },
  { key: 'revisits', label: 'Lịch hẹn' },
  { key: 'timeline', label: 'Dòng thời gian' },
  { key: 'health', label: 'Diễn biến sức khỏe' },
  { key: 'lab-results', label: 'Kết quả xét nghiệm' },
  { key: 'temperatures', label: 'Nhiệt độ' },
] as const;

export type SelfSectionKey = (typeof SECTIONS)[number]['key'];

// BR-049: hồ sơ không hiện số đo thì không có mục biểu đồ.
export function selfSections(showsVitals: boolean) {
  return SECTIONS.filter((item) => item.key !== 'health' || showsVitals);
}

export function parseSelfSection(value: unknown): SelfSectionKey | undefined {
  return SECTIONS.find((item) => item.key === value)?.key;
}

export function resolveSelfSection(
  section: SelfSectionKey | undefined,
  showsVitals: boolean,
): SelfSectionKey {
  return selfSections(showsVitals).find((item) => item.key === section)?.key ?? 'today';
}
