import { StartIcon } from './StartIcon';
export function StartPrivacyNote() {
  return (
    <aside className="household-start-privacy">
      <span className="household-privacy-icon">
        <StartIcon name="shield" />
      </span>
      <div>
        <strong>Sổ sức khỏe riêng của nhà</strong>
        <p>
          Mỗi nhà trên AN GIA có không gian riêng để lưu hồ sơ, giấy tờ và thông tin sức khỏe của người thân.
          Bạn quyết định người được mời tham gia để cùng quản lý sổ tay chăm sóc gia đình.
        </p>
      </div>
    </aside>
  );
}
