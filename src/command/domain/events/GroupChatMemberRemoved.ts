import { GroupChatEvent, generateEventId } from './GroupChatEvent';
import { GroupChatId } from '../models/GroupChatId';
import { UserAccountId } from '../models/UserAccountId';
import { Member } from '../models/Member';

/**
 * GroupChatMemberRemoved - メンバー削除イベント
 */
export class GroupChatMemberRemoved extends GroupChatEvent {
  private readonly member: Member;

  constructor(
    id: string,
    aggregateId: GroupChatId,
    member: Member,
    seqNr: number,
    executorId: UserAccountId,
    occurredAt?: number
  ) {
    super(id, aggregateId, seqNr, executorId, occurredAt);
    this.member = member;
  }

  static create(
    aggregateId: GroupChatId,
    member: Member,
    seqNr: number,
    executorId: UserAccountId
  ): GroupChatMemberRemoved {
    return new GroupChatMemberRemoved(generateEventId(), aggregateId, member, seqNr, executorId);
  }

  static reconstruct(
    id: string,
    aggregateId: GroupChatId,
    member: Member,
    seqNr: number,
    executorId: UserAccountId,
    occurredAt: number
  ): GroupChatMemberRemoved {
    return new GroupChatMemberRemoved(id, aggregateId, member, seqNr, executorId, occurredAt);
  }

  getMember(): Member {
    return this.member;
  }

  getUserAccountId(): UserAccountId {
    return this.member.getUserAccountId();
  }

  getTypeName(): string {
    return 'GroupChatMemberRemoved';
  }

  override toJSON(): object {
    return {
      ...super.toJSON(),
      member: this.member.toJSON(),
    };
  }
}
