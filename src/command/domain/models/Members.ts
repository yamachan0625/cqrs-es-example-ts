import { Member } from './Member';
import { MemberId } from './MemberId';
import { UserAccountId } from './UserAccountId';
import { MemberRole } from './MemberRole';

/**
 * Members - メンバーのコレクション
 */
export class Members {
  private readonly members: ReadonlyArray<Member>;

  private constructor(members: Member[]) {
    this.members = Object.freeze([...members]);
  }

  /**
   * 新しいMembersを作成（管理者を含む）
   */
  static create(administratorId: UserAccountId): Members {
    const adminMember = Member.create(
      MemberId.generate(),
      administratorId,
      MemberRole.admin()
    );
    return new Members([adminMember]);
  }

  /**
   * 既存のメンバーリストからMembersを作成
   */
  static of(members: Member[]): Members {
    if (members.length === 0) {
      throw new Error('Members must not be empty');
    }
    return new Members(members);
  }

  /**
   * 空のMembersを作成（イベントリプレイ用の初期状態）
   */
  static empty(): Members {
    return new Members([]);
  }

  /**
   * 管理者を取得
   */
  getAdministrator(): Member {
    const admin = this.members.find((m) => m.isAdministrator());
    if (!admin) {
      throw new Error('Administrator not found');
    }
    return admin;
  }

  /**
   * メンバーかどうか
   */
  isMember(userAccountId: UserAccountId): boolean {
    return this.members.some((m) => m.getUserAccountId().equals(userAccountId));
  }

  /**
   * 管理者かどうか
   */
  isAdministrator(userAccountId: UserAccountId): boolean {
    return this.members.some(
      (m) => m.getUserAccountId().equals(userAccountId) && m.isAdministrator()
    );
  }

  /**
   * メンバーを追加（ID自動生成）
   */
  addMember(userAccountId: UserAccountId): Members {
    const newMember = Member.create(MemberId.generate(), userAccountId, MemberRole.member());
    return new Members([...this.members, newMember]);
  }

  /**
   * メンバーを追加（IDとRoleを指定）
   */
  addMemberWith(memberId: MemberId, userAccountId: UserAccountId, role: MemberRole): Members {
    const newMember = Member.create(memberId, userAccountId, role);
    return new Members([...this.members, newMember]);
  }

  /**
   * メンバーを削除（UserAccountIdで）
   */
  removeMemberByUserAccountId(userAccountId: UserAccountId): Members {
    const filtered = this.members.filter((m) => !m.getUserAccountId().equals(userAccountId));
    if (filtered.length === this.members.length) {
      throw new Error('Member not found');
    }
    return new Members(filtered);
  }

  /**
   * メンバー数を取得
   */
  size(): number {
    return this.members.length;
  }

  /**
   * メンバーのリストを取得
   */
  getMembers(): ReadonlyArray<Member> {
    return this.members;
  }

  equals(other: Members): boolean {
    if (this.members.length !== other.members.length) {
      return false;
    }
    return this.members.every((m, i) => m.equals(other.members[i]));
  }

  toJSON(): object {
    return {
      members: this.members.map((m) => m.toJSON()),
    };
  }
}
