// Ngưỡng phát hành đã lọc published_at <= now tại adapter, độc lập cách lưu trữ.
export interface LegalRequirement {
  kind: 'terms' | 'privacy';
  currentPublishedAt: Date;
  materialPublishedAt: Date | null;
  acceptedPublishedAt: Date | null;
}
