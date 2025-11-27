import { MemberId } from './MemberId';
import { UserAccountId } from './UserAccountId';
import { MemberRole } from './MemberRole';

/**
 * Member - グループチャットのメンバー
 */
export class Member {
  private readonly id: MemberId;
  private readonly userAccountId: UserAccountId;
  private readonly role: MemberRole;

  constructor(id: MemberId, userAccountId: UserAccountId, role: MemberRole) {
    this.id = id;
    this.userAccountId = userAccountId;
    this.role = role;
  }

  static create(id: MemberId, userAccountId: UserAccountId, role: MemberRole): Member {
    return new Member(id, userAccountId, role);
  }

  getId(): MemberId {
    return this.id;
  }

  getUserAccountId(): UserAccountId {
    return this.userAccountId;
  }

  getRole(): MemberRole {
    return this.role;
  }

  isAdministrator(): boolean {
    return this.role.isAdmin();
  }

  equals(other: Member): boolean {
    return (
      this.id.equals(other.id) &&
      this.userAccountId.equals(other.userAccountId) &&
      this.role.equals(other.role)
    );
  }

  toJSON(): object {
    return {
      id: this.id.toJSON(),
      userAccountId: this.userAccountId.toJSON(),
      role: this.role.toJSON(),
    };
  }
}
