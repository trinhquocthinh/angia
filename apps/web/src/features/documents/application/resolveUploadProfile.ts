type Candidate = { id: string; consentStatus: string };

/** Hồ sơ nhận ảnh: hồ sơ đã chọn nếu đã đồng thuận; chưa chọn mà chỉ có một hồ sơ đã đồng thuận thì dùng hồ sơ đó. */
export function resolveUploadProfile<P extends Candidate>(
  profiles: P[],
  chosenId: string | null,
): P | undefined {
  const confirmed = profiles.filter((profile) => profile.consentStatus === 'confirmed');
  if (chosenId === null) return confirmed.length === 1 ? confirmed[0] : undefined;
  return confirmed.find((profile) => profile.id === chosenId);
}
