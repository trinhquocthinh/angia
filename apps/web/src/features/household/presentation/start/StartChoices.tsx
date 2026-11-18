import { StartIcon } from './StartIcon';
import { StartChoice } from './StartChoice';
import { StartPrivacyNote } from './StartPrivacyNote';
import { StartFamilyCard } from './StartFamilyCard';
export function StartChoices() {
  return (
    <>
      <section
        className="household-start-panel household-start-welcome"
        aria-labelledby="household-start-title"
      >
        <div className="household-start-meta">
          <span className="household-start-kicker">
            <i />
            01 — Bắt đầu
          </span>
          <span className="household-start-mobile-step">Bước 1 trên 2</span>
          <span className="household-start-trust">
            <StartIcon name="shield" />
            Sổ tay chăm sóc gia đình
          </span>
        </div>
        <h1 id="household-start-title">Bắt đầu</h1>
        <p className="household-start-description">
          Tạo nhà của bạn hoặc tham gia bằng mã mời từ người thân.
        </p>
        <div className="household-start-choices">
          <StartChoice create />
          <StartChoice />
        </div>
        <StartPrivacyNote />
      </section>
      <StartFamilyCard />
    </>
  );
}
