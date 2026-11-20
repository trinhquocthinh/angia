import { MemberClayGlyph } from '../members/MemberClayGlyph';
import type { HouseholdGovernanceProps } from './householdGovernanceProps';
import { HouseholdGovernanceLeave } from './HouseholdGovernanceLeave';
import { OwnerGovernanceGrid } from './OwnerGovernanceGrid';

export function HouseholdGovernanceSection(props: HouseholdGovernanceProps) {
  if (!props.self.isOwner) {
    return (
      <div className="household-home-non-owner-leave">
        <HouseholdGovernanceLeave {...props} />
      </div>
    );
  }

  return (
    <section className="household-governance-bento" aria-labelledby="household-governance-title">
      <div className="household-governance-head">
        <div className="household-governance-icon" aria-hidden="true">
          <MemberClayGlyph name="home-delete-shield" size={22} />
        </div>
        <div>
          <h2 id="household-governance-title">Quản trị Quyền Chủ hộ &amp; Pháp lý nhà</h2>
          <p>Trao quyền đại diện, rời nhà hoặc yêu cầu xoá nhà.</p>
        </div>
      </div>
      <OwnerGovernanceGrid props={props} />
    </section>
  );
}
